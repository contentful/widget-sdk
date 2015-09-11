'use strict';
/**
 * @ngdoc service
 * @name ShareJS
 *
 * @description
 * Initializes and provides access to ShareJS
 *
 * TODO
 * Future refactoring tips
 * - It would be good if the ShareJS callbacks were wrapped to return promises
 * - the mkpathAndSetValue does too much
 */
angular.module('contentful')
.provider('ShareJS', ['environment', function ShareJSProvider(environment) {
  var token;
  var url = '//'+environment.settings.ot_host+'/channel';

  this.token = function(_token) {
    token = _token;
  };

  this.url = function(_url) {
    url = _url;
  };

  this.$get = ['$injector', function($injector) {
    var clientAdapter = $injector.get('clientAdapter');
    var $rootScope    = $injector.get('$rootScope');
    var $q            = $injector.get('$q');

    /**
     * Class that wraps the native ShareJS Client
     *
     * Adds state monitoring and event broadcasting as well as support for opening Contentful entities.
     *
     * VERY IMPORTANT:
     *
     * What this _doesn't_ do is integration of ShareJS into Angular.
     * In particular:
     * - Callbacks are not wrapped and exposed as promises
     * - Callback execution is not wrapped in $apply
     */
    function ShareJSClient(url, token) {
      this.token = token;
      this.url = url;
      this.connection = new window.sharejs.Connection(this.url, this.token);
      this.connection.socket.send = function (message) {
        try {
          return this.sendMap({JSON: angular.toJson(message)});
        } catch (error) {
          // Silently ignore the error as this is handled on ot_doc_for
        }
      };

      // Any message on the connection may change our model so we need
      // to apply those changes.
      var connectionEmit = this.connection.emit;
      this.connection.emit = function () {
        $rootScope.$applyAsync();
        connectionEmit.apply(this, arguments);
      };
    }

    ShareJSClient.prototype = {
      _toKey: function toKey(sys) {
        var parts;
        if (sys.type === 'Space')
          parts = [sys.id, 'space'];
        else if (sys.type === 'ContentType')
          parts = [sys.space.sys.id, 'content_type', sys.id];
        else if (sys.type === 'Entry')
          parts = [sys.space.sys.id, 'entry', sys.id];
        else if (sys.type === 'Asset')
          parts = [sys.space.sys.id, 'asset', sys.id];
        else
          throw new Error('Unable to encode key for type ' + sys.type);
        return parts.join('!');
      },

      open: function(entry, callback) {
        var key = this._toKey(entry.data.sys);
        var synchronous = true;
        this.connection.open(key, 'json', function(err, doc){
          if (!err) {
            if (synchronous) {
              _.defer(callback, null, doc);
            } else {
              callback(null, doc);
            }
          } else {
            _.defer(callback, err);
          }
        });
        synchronous = false;
      }

    };

    function getDocRoot(type) {
      switch(type){
        case 'Array': return [];
        case 'Object': return {};
        default: return {};
      }
    }

    /**
     * Public API for the ShareJS service
     */
    var ShareJS = {
      client : null,

      /**
       * @ngdoc method
       * @name ShareJS#connect
       * @description
       * Connects the ShareJS client
       */
      connect: function () {
        ShareJS.client = ShareJS.client || new ShareJSClient(url, token || clientAdapter.token);
      },

      /**
       * @ngdoc method
       * @name ShareJS#open
       * @description
       * Open a ShareJS document for an entity
       *
       * @param {Entity} entity
       * @param {function()} callback
       */
      open: function (entity) {
        ShareJS.connect();
        return $q.denodeify(function (cb) {
          return ShareJS.client.open(entity, cb);
        });
      },

      /**
       * @ngdoc method
       * @name ShareJS#isConnected
       * @return {boolean}
       */
      isConnected: function () {
        return dotty.get(ShareJS, 'client.connection.state') === 'ok';
      },

      /**
       * @ngdoc method
       * @name ShareJS#connectionFailed
       * @return {boolean}
       */
      connectionFailed: function () {
        var state = dotty.get(ShareJS, 'client.connection.state');
        return !(state === 'connecting' || state === 'handshaking' || state === 'ok');
      },

      /**
       * @ngdoc type
       * @name ShareJS.mkpathAndSetValue.params
       * @property {any} value The initial value we want to be at the end of the path
       * @property {OtDoc} doc The document to operate on
       * @property {Array<string>} path An array describing the path in the JSON doc
       * @property {Array<string>} types An array describing the type of each step in
       *   the path as either "Object", "Array" or "String".
       *   This information is used to create the correct
       *   intermediate objects when creating the path.
      */

      /**
       * @ngdoc method
       * @name ShareJS#mkpathAndSetValue
       * @description
       * Creates a deeply nested property in a ShareJS JSON document
       *
       * The purpose is more on making sure that the path exists not
       * that the value is the same value as supplied
       *
       * The behavior when the entire path exists already is to
       * - keep the existing value when it is of the same type as the
       *   `value` parameter
       * - set it to the value parameter otherwise
       *
       * @param {ShareJS.mkpathAndSetValue.params} params
       * @param {function()} callback
       *
       * @usage
       * ShareJS.mkpathAndSetValue({
       *   value: 'Foo'
       *   path:  ['foo', '12']
       *   types: ['Object', 'Array']
       * }, callback);
       */
      mkpathAndSetValue: function(params, callback){
        //jshint boss:true
        var doc = params.doc;
        var segments = _.zip(params.path, params.types || []);
        var value = params.value;
        var tmp, prop, segment, currentVal;

        while(segment = segments.shift()) {
          doc = doc.at(segment[0]);
          if (_.isUndefined(currentVal = doc.get())){
            segments.unshift(segment);
            prop = segments.pop()[0];
            while(segments.length > 0) {
              segment = segments.pop();
              tmp = getDocRoot(segment[1]);
              tmp[prop] = value;
              value = tmp;
              prop = segment[0];
            }
            doc.set(value, callback);
            return;
          }
        }
        // If value at path doesn't match passed in value type replace it
        if (_.isString(currentVal)  && _.isString(value) ) {_.defer(callback); return;}
        if (_.isNumber(currentVal)  && _.isNumber(value) ) {_.defer(callback); return;}
        if (_.isBoolean(currentVal) && _.isBoolean(value)) {_.defer(callback); return;}
        if (_.isNull(currentVal)    && _.isNull(value)   ) {_.defer(callback); return;}
        if (_.isObject(currentVal)  && _.isObject(value) &&
            _.isArray(currentVal)  === _.isArray(value)) {_.defer(callback); return;}

        doc.set(value, callback);
      },

      /**
       * @ngdoc method
       * @name ShareJS#peek
       * @description
       * Read the value at the given path in the doc
       * @param {OtDoc} doc
       * @param {Array<string>} path
       * @return {any}
       */
      peek: function(doc, path) {
        try {
          return doc.getAt(path);
        } catch(e) {
          return void(0);
        }
      }
    };

    return ShareJS;

  }];
}]);
