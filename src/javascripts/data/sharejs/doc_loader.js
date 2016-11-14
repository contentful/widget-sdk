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
  var $q = require('$q');
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
   * @param {ShareJS.Connection} connection
   * @param {string} key
   * @param {Property<string>} connectionState$
   * @param {Property<boolean>} readOnly$
   */
  function create (connection, key, state$, readOnly) {
    var opener = createLoader(connection, key);

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
        opener.close();
        return K.constant(DocLoad.Error('disconnected'));
      }

      if (shouldOpen && (state === 'ok' || state === 'handshaking')) {
        return opener.request().map(function (p) {
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
        opener.close();
        return K.constant(DocLoad.None());
      }
    }).toProperty(_.constant(DocLoad.None()));

    // Emit a value to end the doc loader stream.
    var dead = K.createBus();
    docLoad = docLoad.takeUntilBy(dead.stream);

    return {
      doc: docLoad,
      destroy: function () {
        opener.close();
        dead.emit();
        dead.end();
      }
    };
  }


  function createLoader (connection, key) {
    var docPromise = null;
    var docStream = null;

    return {
      close: close,
      request: request
    };

    function request () {
      if (!docStream) {
        docPromise = openDoc(connection, key);
        docStream = K.promiseProperty(docPromise);
      }
      return docStream;
    }

    function close () {
      if (docPromise) {
        docPromise.then(closeDoc);
      }
      docPromise = null;
      docStream = null;
    }
  }

  function closeDoc (doc) {
    try {
      doc.close();
    } catch (e) {
      if (e.message !== 'Cannot send to a closed connection') {
        throw e;
      }
    }
  }

  function openDoc (connection, key) {
    return $q.denodeify(function (cb) {
      connection.open(key, 'json', cb);
    });
  }
}]);
