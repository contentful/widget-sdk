'use strict';
/**
 * Provide access to ShareJS
 */
angular.module('contentful').provider('ShareJS', ['environment', function ShareJSProvider(environment) {
  var token;
  var url = '//'+environment.settings.ot_host+'/channel';

  this.token= function(e) {
    token = e;
  };

  this.url = function(e) {
    url = e;
  };

  this.$get = ['client', 'clientAdapter', '$rootScope', function(client, clientAdapter, $rootScope) {
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
        // Monkey patch for better Angular compatiblity
        return this.sendMap({JSON: angular.toJson(message)});
      };
      this.connection.on('ok', stateChangeHandler);
      this.connection.on('error', stateChangeHandler);
      this.connection.on('disconnected', stateChangeHandler);
      this.connection.on('connect failed', stateChangeHandler);

      var oldState, c=this;
      function stateChangeHandler(error) {
        if (c.connection.state !== oldState) {
          //console.log('sharejs connection state changed from %o to %o', oldState, c.connection.state);
          $rootScope.$apply(function (scope) {
            scope.$broadcast('otConnectionStateChanged', c.connection.state, c.connection, error);
          });
          oldState = c.connection.state;
        }
      }
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

      connect: function () {
        ShareJS.client = ShareJS.client || new ShareJSClient(url, token || clientAdapter.token);
      },

      /**
       * Open a ShareJS document for an entity
       */
      open: function (/* entity, callback */) {
        ShareJS.connect();
        return ShareJS.client.open.apply(ShareJS.client, arguments);
      },
      isConnected: function () {
        return ShareJS.client && ShareJS.client.connection.state == 'ok';
      },
      /**
       * Created a deeply nested property in a ShareJS JSON document
       *
       * The purpose is more on making sure that the path exists not
       * that the value is the same value as supplied
       * 
       * Params are given as an object in the params argument
       * with these properties:
       * - value: The initial value we want to be at the end of the path
       * - doc: The document to operate on
       * - path: An array describing the path in the JSON doc
       * - types: An array describing the type of each step in
       *   the path as either "Object", "Array" or "String".
       *   This information is used to create the correct
       *   intermediate objects when creating the path.
       *
       * Example:
       *
       *   value: 'Foo'
       *   path:  ['foo', '12']
       *   types: ['Object', 'Array']
       *
       * would create a property foo on an object, assign it an Array
       * and set foo[12] to be a String 'Foo' types are optional and
       * assumed to be "Object" if missing.
       *
       * The behavior when the entire path exists already is to
       * - keep the existing value when it is of the same type as the
       *   `value` parameter
       * - set it to the value parameter otherwise
       *
       */
      mkpath: function(params, callback){
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

      // Read out the value at the path
      //
      // Returns undefined if missing
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
