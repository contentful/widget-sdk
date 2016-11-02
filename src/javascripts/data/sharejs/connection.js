'use strict';

angular.module('cf.data')

/**
 * @ngdoc type
 * @module cf.data
 * @name data/ShareJS/Connection
 * @usage[js]
 * var Connection = require('data/ShareJS/Connection')
 * var connection = Connection.create(token, host, spaceId)
 */
.factory('data/ShareJS/Connection', ['require', function (require) {
  var ShareJS = require('libs/sharejs');
  var caseof = require('libs/sum-types').caseof;
  var K = require('utils/kefir');
  var $q = require('$q');
  var DocLoader = require('data/ShareJS/Connection/DocLoader');
  var DocLoad = DocLoader.DocLoad;

  return {
    create: create,
    DocLoad: DocLoad
  };

  function create (token, host, spaceId) {
    /**
     * `connection.state` may be
     * - 'connecting': The connection is being established
     * - 'handshaking': The connection has been established, but we don't have the auth ID yet
     * - 'ok': We have connected and recieved our client ID. Ready for data.
     * - 'disconnected': The connection is closed, but it will not reconnect automatically.
     * - 'stopped': The connection is closed, and will not reconnect.
     * (From ShareJS client docs)
     */
    var connection = createBaseConnection(token, host, spaceId);

    var events = getEventStream(connection);


    /**
     * @type {Property<string>}
     * Stream that hold the current connection state
     *
     * We skip the 'connecting' value when reconnecting and go straight
     * to 'hanshaking'
     *
     *    connecting
     * -> handshaking
     * -> ok
     * -> disconnected
     * -> handshaking
     * -> ...
     */
    // Set to false after we connected once
    var initialConnect = true;
    var state$ = K.sampleBy(events, function () {
      if (connection.state === 'connecting') {
        if (initialConnect) {
          initialConnect = false;
          return 'connecting';
        } else {
          return 'disconnected';
        }
      } else {
        return connection.state;
      }

    }).skipDuplicates();


    return {
      getDocLoader: getDocLoader,
      open: open,
      close: close
    };


    /**
     * @ngdoc method
     * @module cf.data
     * @name data/ShareJS/Connection#getDocLoader
     *
     * @param {Client.Entity} entity
     * @param {Property<boolean>} readOnly
     * @returns {Document.Loader}
     */
    function getDocLoader (entity, readOnly) {
      var key = entityMetadataToKey(entity.data.sys);
      return DocLoader.create(connection, key, state$, readOnly);
    }


    /**
     * @ngdoc method
     * @module cf.data
     * @name data/ShareJS/Connection#open
     *
     * @param {Client.Entity} entity
     */
    function open (entity) {
      var readOnly = K.constant(false);
      var loader = getDocLoader(entity, readOnly);

      return loader.doc
        .flatten(function (docLoad) {
          return caseof(docLoad, [
            [DocLoad.Doc, function (d) { return [d.doc]; }],
            [DocLoad.Error, function (e) { throw e.error; }],
            [DocLoad.None, _.constant([])]
          ]);
        })
        .take(1)
        .toPromise($q)
        .then(function (doc) {
          return {doc: doc, destroy: loader.destroy};
        });
    }


    /**
     * @ngdoc method
     * @module cf.data
     * @name data/ShareJS/Connection#close
     */
    function close () {
      connection.disconnect();
    }
  }


  /**
   * Patches the underlying ShareJS connection object so that events
   * are emitted to the returned stream
   */
  function getEventStream (connection) {
    var eventBus = K.createBus();

    var connectionEmit = connection.emit;
    connection.emit = function (name, data) {
      eventBus.emit({name: name, data: data});
      return connectionEmit.apply(this, arguments);
    };

    return eventBus.stream;
  }


  function createBaseConnection (token, host, spaceId) {
    var url = '//' + host + '/spaces/' + spaceId + '/channel';
    var connection = new ShareJS.Connection(url, token);

    // I’m not sure why we do this
    connection.socket.send = function (message) {
      try {
        return this.sendMap({JSON: angular.toJson(message)});
      } catch (error) {
        // Silently ignore the error as this is handled on ot_doc_for
      }
    };

    return connection;
  }

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
}]);
