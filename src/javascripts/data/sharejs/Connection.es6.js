import { constant } from 'lodash';
import ShareJS from '@contentful/sharejs/lib/client';
import { caseof, caseofEq } from 'sum-types';
import * as K from 'utils/kefir.es6';
import $q from '$q';
import * as DocLoader from 'data/sharejs/DocLoader.es6';

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
 * @param {string} baseUrl  URL where the ShareJS service lives
 * @param {string} spaceId
 * @param {Authorization} auth
 * @returns Connection
 */
export function create(baseUrl, auth, spaceId, environmentId) {
  /**
   * `connection.state` may be
   * - 'connecting': The connection is being established
   * - 'handshaking': The connection has been established, but we don't have the auth ID yet
   * - 'ok': We have connected and recieved our client ID. Ready for data.
   * - 'disconnected': The connection is closed, but it will not reconnect automatically.
   * - 'stopped': The connection is closed, and will not reconnect.
   * (From ShareJS client docs)
   */
  const connection = createBaseConnection(baseUrl, auth.getToken, spaceId, environmentId);

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

  const state$ = K.sampleBy(events, () => {
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

  /**
   * @ngdoc method
   * @module cf.data
   * @name data/ShareJS/Connection#refreshAuth
   * @description
   * Gets a new auth token and sends it to sharejs server. If one refresh auth
   * call is in progress, doesn't send a new one and returns the ongoing call's
   * promise.
   * See wrapActionWithLock() for more details
   *
   * @returns {Promise}
   */
  const refreshAuth = wrapActionWithLock(() => auth.refreshToken());

  const unsubscribeAuthTokenChanges = K.onValue(auth.token$, sendAuthToken);

  return {
    getDocLoader,
    open,
    close,
    refreshAuth
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
  function getDocLoader(entity, shouldOpen$) {
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
  function open(entity) {
    const shouldOpen = K.constant(true);
    const loader = getDocLoader(entity, shouldOpen);

    return loader.doc
      .flatten(docLoad =>
        caseof(docLoad, [
          [DocLoad.Doc, d => [d.doc]],
          [
            DocLoad.Error,
            e => {
              throw e.error;
            }
          ],
          [DocLoad.None, constant([])],
          [DocLoad.Pending, constant([])]
        ])
      )
      .take(1)
      .toPromise($q)
      .then(doc => ({
        doc,
        destroy: loader.destroy
      }));
  }

  /**
   * @ngdoc method
   * @module cf.data
   * @name data/ShareJS/Connection#close
   */
  function close() {
    connection.disconnect();
    unsubscribeAuthTokenChanges();
  }

  function getDocWrapperForEntity(entity) {
    const key = entityMetadataToKey(environmentId, entity.data.sys);
    let docWrapper = docWrappers[key];

    if (!docWrapper) {
      docWrappers[key] = docWrapper = createDocWrapper(connection, key);
    }

    return docWrapper;
  }

  function sendAuthToken(token) {
    // connectin.state should be 'ok' to be able to send a new token
    if (connection.state === 'ok') {
      try {
        connection.refreshAuth(token);
      } catch (e) {
        // close the connection if authorization failed
        close();
      }
    }
  }
}

/**
 * Patches the underlying ShareJS connection object so that events
 * are emitted to the returned stream
 */
function getEventStream(connection) {
  const eventBus = K.createBus();

  const connectionEmit = connection.emit;
  connection.emit = function(name, data) {
    eventBus.emit({ name, data });
    return connectionEmit.apply(this, arguments);
  };

  return eventBus.stream;
}

function createBaseConnection(baseUrl, getToken, spaceId, environmentId) {
  const url = baseUrl + '/spaces/' + spaceId + '/channel';
  const connection = new ShareJS.Connection(url, getToken, spaceId, environmentId);

  // I’m not sure why we do this
  connection.socket.send = function(message) {
    try {
      /* global angular */
      return this.sendMap({ JSON: angular.toJson(message) });
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
function createDocWrapper(connection, key) {
  let rawDoc = null;
  let closePromise = $q.resolve();

  const open = () => $q.denodeify(cb => connection.open(key, 'json', cb));
  const close = doc =>
    $q.denodeify(cb => {
      try {
        doc.close(cb);
        // Because of a bug in ShareJS we also need to listen for the
        // 'closed' event
        doc.on('closed', () => cb());
      } catch (e) {
        // Always resolve and ignore errors on closing
        cb();
      }
    });

  return {
    open: () =>
      closePromise.then(open).then(openedDoc => {
        rawDoc = openedDoc;
        return rawDoc;
      }),
    close: () => {
      if (rawDoc) {
        closePromise = close(rawDoc);
        rawDoc = null;
      }
    }
  };
}

function entityMetadataToKey(environmentId, sys) {
  const typeSegment = caseofEq(sys.type, [['Entry', () => 'entry'], ['Asset', () => 'asset']]);
  return [sys.space.sys.id, environmentId, typeSegment, sys.id].join('!');
}

/**
 * @ngdoc method
 * @name wrapActionWithLock
 * @description
 * Wraps a promise-returning action so it can not be called multiple times
 * simultaneously.
 *
 * When wrapped action hasn't been resolved and is called subsequently,
 * the same promise from previous call is returned and a new action isn't
 * performed. Rejected state is terminal: if a call ended up being rejected,
 * all subsequent calls will return a rejected promise.
 *
 * @param {function(): Promise} action
 * @returns {function(): Promise}
 */
function wrapActionWithLock(action) {
  let actionPromise = null;

  return () => {
    if (!actionPromise) {
      actionPromise = action().then(() => {
        actionPromise = null;
      });
    }

    return actionPromise;
  };
}
