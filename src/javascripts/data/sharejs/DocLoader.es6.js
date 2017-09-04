import * as K from 'utils/kefir';
import {caseof, makeSum} from 'libs/sum-types';
import {constant} from 'lodash';

/**
 * @ngdoc service
 * @name data/ShareJS/Connection/DocLoader
 * @description
 * Creates a property that holds the current state of loading a
 * document.
 *
 * This module is tested in the 'data/ShareJS/Connection' tests.
 */

export const DocLoad = makeSum({
  /**
   * @ngdoc method
   * @name data/ShareJS/Connection/DocLoader#DocLoad.None
   * @description
   * Constructor representing that we are not requesting a document.
   */
  None: [],
  /**
   * @ngdoc method
   * @name data/ShareJS/Connection/DocLoader#DocLoad.Pending
   * @description
   * Constructor representing that we are currently loading a
   * document.
   */
  Pending: [],
  /**
   * @ngdoc method
   * @name data/ShareJS/Connection/DocLoader#DocLoad.Doc
   * @description
   * Constructor holding an opened ShareJS document
   * @param {ShareJS.Document} doc
   */
  Doc: ['doc'],
  /**
   * @ngdoc method
   * @name data/ShareJS/Connection/DocLoader#DocLoad.Error
   * @description
   * Constructor holding an opening error, for example if the
   * connection to the server has dropped.
   * @param {string} error
   */
  Error: ['error']
});

/**
 * @ngdoc method
 * @name data/ShareJS/Connection/DocLoader#create
 * @param {DocWrapper} docWrapper
 * @param {Property<string>} connectionState$
 *   Holds the global ShareJS connection state.
 * @param {Property<boolean>} shouldOpen$
 *   Indicates wheter we want to establish a connection.
 */
export function create (docWrapper, connectionState$, shouldOpen$) {
  // The state of the current request for a document. Might be null in
  // case it does not exist yet.
  let currentDocRequest = null;

  // Property<{state, shouldOpen}>
  const requestOpenDoc = K.combine(
    [connectionState$, shouldOpen$],
    function (connectionState, shouldOpen) {
      return {connectionState, shouldOpen};
    }
  ).skipDuplicates().toProperty();

  const dead = K.createBus();

  const docLoad = requestOpenDoc.flatMapLatest(({connectionState, shouldOpen}) => {
    // TODO we should separate this into two services: One that
    // provides a document stream based on the connection state and
    // another one, based on the former, that handles the 'shouldOpen'
    // state.
    if (connectionState === 'disconnected') {
      close();
      return K.constant(DocLoad.Error('disconnected'));
    }

    if (!shouldOpen) {
      close();
      return K.constant(DocLoad.None());
    }

    if (connectionState === 'ok' || connectionState === 'handshaking') {
      currentDocRequest = currentDocRequest || openDoc();
      return currentDocRequest;
    } else if (connectionState === 'connecting') {
      return K.constant(DocLoad.Pending());
    } else {
      close();
      return K.constant(DocLoad.None());
    }
  })
  .toProperty(constant(DocLoad.None()))
  .takeUntilBy(dead.stream);

  return {
    doc: docLoad,
    close: close,
    destroy: destroy
  };

  function close () {
    docWrapper.close();
    currentDocRequest = null;
  }

  function destroy () {
    close();
    dead.emit();
    dead.end();
  }

  function openDoc () {
    return K.promiseProperty(docWrapper.open())
    .map(function (p) {
      return caseof(p, [
        [K.PromiseStatus.Pending, function () {
          return DocLoad.Pending();
        }],
        [K.PromiseStatus.Resolved, function (x) {
          return DocLoad.Doc(x.value);
        }],
        [K.PromiseStatus.Rejected, function (x) {
          return DocLoad.Error(x.error);
        }]
      ]);
    });
  }
}
