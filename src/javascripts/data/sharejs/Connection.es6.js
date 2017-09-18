import {constant} from 'lodash';
import ShareJS from 'libs/sharejs';
import {caseof, caseofEq} from 'libs/sum-types';
import * as K from 'utils/kefir';
import $q from '$q';
import * as DocLoader from 'data/sharejs/DocLoader';

export const DocLoad = DocLoader.DocLoad;

/**
 * @ngdoc type
 * @module cf.data
 * @name data/ShareJS/Connection
 * @usage[js]
 * var Connection = require('data/ShareJS/Connection')
 * var connection = Connection.create(getToken, baseUrl, spaceId)
 */

/**
 * @param {function(): Promise<string>} getToken
 * @param {string} baseUrl  URL where the ShareJS service lives
 * @param {string} spaceId
 * @returns Connection
 */
export function create (getToken, baseUrl, spaceId) {
  /**
   * `connection.state` may be
   * - 'connecting': The connection is being established
   * - 'handshaking': The connection has been established, but we don't have the auth ID yet
   * - 'ok': We have connected and recieved our client ID. Ready for data.
   * - 'disconnected': The connection is closed, but it will not reconnect automatically.
   * - 'stopped': The connection is closed, and will not reconnect.
   * (From ShareJS client docs)
   */
  const connection = createBaseConnection(getToken, baseUrl, spaceId);

  const events = getEventStream(connection);

  const docWrappers = {};


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
  let initialConnect = true;

  const state$ = K.sampleBy(events, function () {
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
   * @param {Property<boolean>} shouldOpen
   *   Indicates wheter we want to establish a connection.
   * @returns {Document.Loader}
   */
  function getDocLoader (entity, shouldOpen$) {
    const docWrapper = getDocWrapperForEntity(entity);
    return DocLoader.create(docWrapper, state$, shouldOpen$);
  }


  /**
   * @ngdoc method
   * @module cf.data
   * @name data/ShareJS/Connection#open
   *
   * @param {Client.Entity} entity
   */
  function open (entity) {
    const shouldOpen = K.constant(true);
    const loader = getDocLoader(entity, shouldOpen);

    return loader.doc
      .flatten(function (docLoad) {
        return caseof(docLoad, [
          [DocLoad.Doc, function (d) { return [d.doc]; }],
          [DocLoad.Error, function (e) { throw e.error; }],
          [DocLoad.None, constant([])],
          [DocLoad.Pending, constant([])]
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


  function getDocWrapperForEntity (entity) {
    const key = entityMetadataToKey(entity.data.sys);
    let docWrapper = docWrappers[key];

    if (!docWrapper) {
      docWrappers[key] = docWrapper = createDocWrapper(connection, key);
    }

    return docWrapper;
  }
}


/**
 * Patches the underlying ShareJS connection object so that events
 * are emitted to the returned stream
 */
function getEventStream (connection) {
  const eventBus = K.createBus();

  const connectionEmit = connection.emit;
  connection.emit = function (name, data) {
    eventBus.emit({name: name, data: data});
    return connectionEmit.apply(this, arguments);
  };

  return eventBus.stream;
}


function createBaseConnection (getToken, baseUrl, spaceId) {
  const url = baseUrl + '/spaces/' + spaceId + '/channel';
  const connection = new ShareJS.Connection(url, getToken);

  // I’m not sure why we do this
  connection.socket.send = function (message) {
    try {
      /* global angular */
      return this.sendMap({JSON: angular.toJson(message)});
    } catch (error) {
      // Silently ignore the error as this is handled on ot_doc_for
    }
  };

  return connection;
}

/**
 * @ngdoc type
 * @name data/ShareJS/Connection/DocWrapper
 * @param {ShareJS.Connection} connection
 * @param {string} key
 * @returns {DocWrapper}
 */
function createDocWrapper (connection, key) {
  let rawDoc = null;
  let closePromise = $q.resolve();

  return {
    open: waitAndOpen,
    close: maybeClose
  };

  function waitAndOpen () {
    return closePromise.then(function () {
      closePromise = $q.resolve();
      return open();
    }, function () {
      closePromise = $q.resolve();
    });
  }

  function open () {
    return $q.denodeify(function (cb) {
      connection.open(key, 'json', cb);
    }).then(function (openedDoc) {
      rawDoc = openedDoc;
      return rawDoc;
    });
  }

  function maybeClose () {
    if (rawDoc) {
      closePromise = close(rawDoc);
      rawDoc = null;
    }
  }

  function close (doc) {
    return $q.denodeify(function (cb) {
      try {
        doc.close(cb);
        // Because of a bug in ShareJS we also need to listen for the
        // 'closed' event
        doc.on('closed', () => cb());
      } catch (e) {
        cb(e.message === 'Cannot send to a closed connection' ? null : e);
      }
    });
  }
}

function entityMetadataToKey (sys) {
  const typeSegment = caseofEq(sys.type, [
    ['Entry', () => 'entry'],
    ['Asset', () => 'asset']
  ]);
  return [sys.space.sys.id, typeSegment, sys.id].join('!');
}
