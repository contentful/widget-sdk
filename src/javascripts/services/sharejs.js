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
.factory('ShareJS', ['require', function (require) {
  var environment = require('environment');
  var ShareJSClient = require('ShareJS/Client');
  var $q = require('$q');

  var url = '//' + environment.settings.ot_host + '/channel';
  var client;

  var ShareJS = {
    /**
     * @ngdoc method
     * @name ShareJS#connect
     * @description
     * Connects the ShareJS client
     */
    connect: function (token) {
      if (client) {
        throw new Error('Attempted to connect twice to ShareJS');
      }
      client = new ShareJSClient(url, token);
    },

    /**
     * @ngdoc method
     * @name ShareJS#open
     * @description
     * Open a ShareJS document for an entity
     *
     * @param {Entity} entity
     * @returns {Promise<void>}
     */
    open: function (entity) {
      return client.open(entity);
    },

    /**
     * @ngdoc method
     * @name ShareJS#isConnected
     * @return {boolean}
     */
    isConnected: function () {
      return client.isConnected();
    },

    /**
     * @ngdoc method
     * @name ShareJS#connectionFailed
     * @return {boolean}
     */
    connectionFailed: function () {
      return client.connectionFailed();
    },


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
     * TODO not setting the value does not make sense at all!
     *
     * @param {OtDoc} doc The document to operate on
     * @param {Array<string>} path An array describing the path in the JSON doc
     * @param {any} value The initial value we want to be at the end of the path
     * @returns {Promise<void>}
     *
     * @usage
     * ShareJS.mkpathAndSetValue(
     *   shareJsDoc,
     *   ['foo', '12']
     *   'Foo'
     * });
     */
    mkpathAndSetValue: function (doc, path, value) {
      return $q.denodeify(function (callback) {
        var segments = path.slice();
        var tmp, prop, segment, currentVal;

        /* eslint no-cond-assign: "off" */
        while (segment = segments.shift()) {
          doc = doc.at(segment);
          currentVal = doc.get();
          var hasNoContainer = segments.length && !(_.isObject(currentVal) || _.isArray(currentVal));
          if (hasNoContainer) {
            segments.unshift(segment);
            prop = segments.pop();
            while (segments.length > 0) {
              segment = segments.pop();
              tmp = {};
              tmp[prop] = value;
              value = tmp;
              prop = segment;
            }
            // TODO I am pretty sure this is not what we want: We
            // only create *one* container, set the value and return
            // from the function.
            doc.set(value, callback);
            return;
          }
        }
        // If value at path doesn't match passed in value type replace it
        if (_.isString(currentVal) && _.isString(value)) { _.defer(callback); return; }
        if (_.isNumber(currentVal) && _.isNumber(value)) { _.defer(callback); return; }
        if (_.isBoolean(currentVal) && _.isBoolean(value)) { _.defer(callback); return; }
        if (_.isNull(currentVal) && _.isNull(value)) { _.defer(callback); return; }
        if (_.isObject(currentVal) && _.isObject(value) &&
            _.isArray(currentVal) === _.isArray(value)) { _.defer(callback); return; }

        doc.set(value, callback);
      });
    },

    /**
     * @ngdoc method
     * @name ShareJS#setDeep
     * @description
     * Sets the value at the given path in the document.
     *
     * Works like `doc.setAt(path, value)` but also creates missing
     * intermediate containers with `mkPathAndSetValue`.
     *
     * The function does not cause an update if the current value in
     * the document equals the new value.
     *
     * @todo We should remove the public `mkPathAndSetValue` in favor
     * of this.
     *
     * @param {OtDoc} doc
     * @param {Array<string>} path
     * @param {any} value
     * @return {Promise<void>}
     */
    setDeep: function (doc, path, value) {
      if (!doc) {
        throw new TypeError('No ShareJS document provided');
      }
      if (!path) {
        throw new TypeError('No path provided');
      }

      var current = ShareJS.peek(doc, path);
      if (value === current) {
        return $q.resolve();
      }

      if (current === undefined) {
        return ShareJS.mkpathAndSetValue(doc, path, value);
      } else {
        return $q.denodeify(function (cb) {
          doc.setAt(path, value, cb);
        });
      }
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
    peek: function (doc, path) {
      try {
        return doc.getAt(path);
      } catch (e) {
        return;
      }
    }
  };

  return ShareJS;
}])

.factory('ShareJS/Client', ['$injector', function ($injector) {
  var $rootScope = $injector.get('$rootScope');
  var $window = $injector.get('$window');
  var $q = $injector.get('$q');

  // List of `connection.state` values that indicate no failure
  var VALID_STATES = ['connecting', 'handshaking', 'ok'];

  /**
   * Class that wraps the native ShareJS Client
   *
   * Adds state monitoring and event broadcasting as well as support
   * for opening Contentful entities.
   */
  function Client (url, token) {
    this._connection = new $window.sharejs.Connection(url, token);
    this._connection.socket.send = function (message) {
      try {
        return this.sendMap({JSON: angular.toJson(message)});
      } catch (error) {
        // Silently ignore the error as this is handled on ot_doc_for
      }
    };

    // Any message on the connection may change our model so we need
    // to apply those changes.
    var connectionEmit = this._connection.emit;
    this._connection.emit = function () {
      $rootScope.$applyAsync();
      connectionEmit.apply(this, arguments);
    };
  }

  Client.prototype.open = function open (entry) {
    var key = entityMetadataToKey(entry.data.sys);
    var connection = this._connection;
    return $q.denodeify(function (cb) {
      connection.open(key, 'json', cb);
    });
  };

  Client.prototype.isConnected = function () {
    return this._connection.state === 'ok';
  };

  Client.prototype.connectionFailed = function () {
    var state = this._connection.state;
    return !_.includes(VALID_STATES, state);
  };

  function entityMetadataToKey (sys) {
    switch (sys.type) {
      case 'Entry':
        return [sys.space.sys.id, 'entry', sys.id].join('!');
      case 'Asset':
        return [sys.space.sys.id, 'asset', sys.id].join('!');
      default:
        throw new Error('Unable to encode key for type ' + sys.type);
    }
  }

  return Client;
}]);
