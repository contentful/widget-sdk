import * as K from 'utils/kefir.es6';
import { caseof, makeSum } from 'sum-types';
import { constant } from 'lodash';

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
export function create(docWrapper, connectionState$, shouldOpen$) {
  // The state of the current request for a document. Might be null in
  // case it does not exist yet.
  let currentDocRequest = null;

  // The raw ShareJS document if it has been openeed. Set when the the
  // document is opened, reset when it is closed.
  let currentDoc = null;

  // A list of ops that where pending when the connection disconnected.
  // This is set when the connection disconnects.
  // We re-apply these ops when the connection is reestablished and the
  // document reappears.
  let pendingOps = [];

  // Property<{state, shouldOpen}>
  const requestOpenDoc = K.combine(
    [connectionState$, shouldOpen$],
    (connectionState, shouldOpen) => ({
      connectionState,
      shouldOpen
    })
  )
    .skipDuplicates()
    .toProperty();

  const dead = K.createBus();

  const docLoad = requestOpenDoc
    .flatMapLatest(({ connectionState, shouldOpen }) => {
      // TODO we should separate this into two services: One that
      // provides a document stream based on the connection state and
      // another one, based on the former, that handles the 'shouldOpen'
      // state.
      if (connectionState === 'disconnected') {
        pendingOps = [];
        if (currentDoc && currentDoc.inflightOp) {
          pendingOps.push(currentDoc.inflightOp);
        }
        if (currentDoc && currentDoc.pendingOp) {
          pendingOps.push(currentDoc.pendingOp);
        }
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
    close,
    destroy
  };

  function close() {
    docWrapper.close();
    currentDocRequest = null;
    currentDoc = null;
  }

  function destroy() {
    pendingOps = null;
    close();
    dead.emit();
    dead.end();
  }

  function openDoc() {
    return K.promiseProperty(docWrapper.open()).map(p =>
      caseof(p, [
        [K.PromiseStatus.Pending, () => DocLoad.Pending()],
        [
          K.PromiseStatus.Resolved,
          x => {
            currentDoc = x.value;
            // There might be multiple doc loaders for a given doc. To
            // avoid applying pending operations twice we check if the
            // doc already has pending operations. These pending
            // operations can only come from the code below because any
            // code that would create an operation executes after the
            // code below.
            if (!currentDoc.pendingOp) {
              pendingOps.forEach(op => currentDoc.submitOp(op));
            }
            pendingOps = [];
            return DocLoad.Doc(currentDoc);
          }
        ],
        [K.PromiseStatus.Rejected, x => DocLoad.Error(x.error)]
      ])
    );
  }
}
