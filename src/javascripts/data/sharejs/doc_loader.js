'use strict';

angular.module('cf.data')
/**
 * @ngdoc service
 * @name data/ShareJS/Connection/DocLoader
 * @description
 * Creates a property that holds the current state of loading a
 * document.
 */
.factory('data/ShareJS/Connection/DocLoader', ['require', function (require) {
  var K = require('utils/kefir');
  var SumTypes = require('libs/sum-types');
  var caseof = SumTypes.caseof;

  var DocLoad = SumTypes.makeSum({
    /**
     * @ngdoc method
     * @name data/ShareJS/Connection/DocLoader#DocLoad.None
     * @description
     * Constructor representing that no document is loaded yet.
     */
    None: [],
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

  return {
    create: create,
    DocLoad: DocLoad
  };

  /**
   * @ngdoc method
   * @name data/ShareJS/Connection/DocLoader#create
   * @param {DocWrapper} docWrapper
   * @param {Property<string>} connectionState$
   * @param {Property<boolean>} readOnly$
   */
  function create (docWrapper, state$, readOnly) {
    var docStream = null;

    // Property<boolean>
    // True when we want the doc to be opened
    var requestOpenDoc = K.combine(
      [state$, readOnly],
      function (state, readOnly) {
        return {state: state, shouldOpen: !readOnly};
      }
    ).skipDuplicates().toProperty();


    var docLoad = requestOpenDoc.flatMapLatest(function (vals) {
      var state = vals.state;
      var shouldOpen = vals.shouldOpen;

      if (state === 'disconnected') {
        close();
        return K.constant(DocLoad.Error('disconnected'));
      }

      if (shouldOpen && (state === 'ok' || state === 'handshaking')) {
        docStream = docStream || K.promiseProperty(docWrapper.open());
        return docStream.map(function (p) {
          return caseof(p, [
            [K.PromiseStatus.Pending, function () {
              return DocLoad.None();
            }],
            [K.PromiseStatus.Resolved, function (x) {
              return DocLoad.Doc(x.value);
            }],
            [K.PromiseStatus.Rejected, function (x) {
              return DocLoad.Error(x.error);
            }]
          ]);
        });
      } else {
        close();
        return K.constant(DocLoad.None());
      }
    }).toProperty(_.constant(DocLoad.None()));

    // Emit a value to end the doc loader stream.
    var dead = K.createBus();
    docLoad = docLoad.takeUntilBy(dead.stream);

    return {
      doc: docLoad,
      close: close,
      destroy: destroy
    };

    function close () {
      docWrapper.close();
      docStream = null;
    }

    function destroy () {
      close();
      dead.emit();
      dead.end();
    }
  }
}]);
