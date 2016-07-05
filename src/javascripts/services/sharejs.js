'use strict';
/**
 * @ngdoc service
 * @name ShareJS
 *
 * @description
 * Initializes and provides access to ShareJS
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

    setDeep: setDeep,

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


  /**
   * @ngdoc method
   * @name ShareJS#setDeep
   * @description
   * Sets the value at the given path in the document.
   *
   * Works like `doc.setAt(path, value)` but also creates missing
   * intermediate containers.
   *
   * The function does not cause an update if the current value in
   * the document equals the new value.
   *
   * @param {OtDoc} doc
   * @param {Array<string>} path
   * @param {any} value
   * @return {Promise<void>}
   */
  function setDeep (doc, path, value) {
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

    return $q.denodeify(function (callback) {
      var container = getContainer(doc, path);
      var wrappedValue = makeDeepObject(container.restPath, value);
      container.doc.set(wrappedValue, callback);
    });
  }

  function makeDeepObject (path, value) {
    if (path.length === 0) {
      return value;
    } else {
      var obj = {};
      dotty.put(obj, path, value);
      return obj;
    }
  }

  function getContainer (doc, path) {
    var segment;
    path = path.slice();
    /* eslint no-cond-assign: "off" */
    while (segment = path.shift()) {
      doc = doc.at(segment);
      var value = doc.get();
      var isContainer = _.isObject(value) || _.isArray(value);
      if (!isContainer) {
        break;
      }
    }
    return {doc: doc, restPath: path};
  }
}])

.factory('ShareJS/Client', ['require', function (require) {
  var $rootScope = require('$rootScope');
  var $window = require('$window');
  var $q = require('$q');

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
