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
  var $q = require('$q');
  var K = require('utils/kefir');

  // A list of connection states that allow us to open documents.
  var CAN_OPEN_STATES = ['connecting', 'handshaking', 'ok'];

  return {create: create};

  function create (token, host, spaceId) {
    var url = '//' + host + '/spaces/' + spaceId + '/channel';

    /**
     * `connection.state` may be
     * - 'connecting': The connection is being established
     * - 'handshaking': The connection has been established, but we don't have the auth ID yet
     * - 'ok': We have connected and recieved our client ID. Ready for data.
     * - 'disconnected': The connection is closed, but it will not reconnect automatically.
     * - 'stopped': The connection is closed, and will not reconnect.
     * (From ShareJS client docs)
     */
    var connection = new ShareJS.Connection(url, token);

    // I’m not sure why we do this
    connection.socket.send = function (message) {
      try {
        return this.sendMap({JSON: angular.toJson(message)});
      } catch (error) {
        // Silently ignore the error as this is handled on ot_doc_for
      }
    };

    var eventBus = K.createBus();

    /**
     * @ngdoc property
     * @module cf.data
     * @name data/ShareJS/Connection#errors
     * @description
     * Stream that fires an event whenever the connection has an error.
     *
     * This is the case if the connection with the ShareJS server
     * fails.
     *
     * @type {Stream<string>}
     */
    var errors = eventBus.stream.filter(function (event) {
      return event.name === 'error';
    }).map(function (event) {
      return event.data;
    });

    var connectionEmit = connection.emit;
    connection.emit = function (name, data) {
      eventBus.emit({name: name, data: data});
      return connectionEmit.apply(this, arguments);
    };

    return {
      open: open,
      canOpen: canOpen,
      close: close,
      errors: errors
    };

    /**
     * @ngdoc method
     * @module cf.data
     * @name data/ShareJS/Connection#errors
     * @description
     * Returns 'true' if and only if we can open a document with
     * `#open()`.
     *
     * @returns {boolean}.
     */
    function canOpen () {
      return _.includes(CAN_OPEN_STATES, connection.state);
    }

    /**
     * @ngdoc method
     * @module cf.data
     * @name data/ShareJS/Connection#open
     * @description
     * Open a ShareJS document for the given entity
     *
     * @param {Client.Entity} entity
     * @returns {Promise<ShareJS/Document}
     */
    function open (entity) {
      var key = entityMetadataToKey(entity.data.sys);
      return $q.denodeify(function (cb) {
        connection.open(key, 'json', cb);
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
