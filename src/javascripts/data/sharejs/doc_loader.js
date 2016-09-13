'use strict';

angular.module('cf.data')
.factory('data/ShareJS/Connection/DocLoader', ['require', function (require) {
  var $q = require('$q');
  var K = require('utils/kefir');
  var SumTypes = require('libs/sum-types');
  var caseof = SumTypes.caseof;

  var DocLoad = SumTypes.makeSum({
    None: [],
    Doc: ['doc'],
    Error: ['error']
  });

  return {
    create: create,
    DocLoad: DocLoad
  };

  function create (connection, canOpen, entity, readOnly) {
    var closeCurrent;

    var requestOpenDoc = K.combine(
      [readOnly, canOpen],
      function (readOnly, canOpen) { return canOpen && !readOnly; }
    ).skipDuplicates().toProperty();

    var docLoad = requestOpenDoc.flatMapLatest(function (shouldOpen) {
      if (closeCurrent) {
        closeCurrent();
      }
      if (shouldOpen) {
        var opened = openDoc(connection, entity);
        closeCurrent = opened.close;
        return K.fromPromise(opened.docLoad);
      } else {
        return K.constant(DocLoad.None());
      }
    }).toProperty(_.constant(DocLoad.None()));

    // Emit a value to end the doc loader stream.
    var dead = K.createBus();
    docLoad = docLoad.takeUntilBy(dead.stream);

    return {
      doc: docLoad,
      destroy: function () {
        if (closeCurrent) {
          closeCurrent();
        }
        dead.emit();
        dead.end();
      }
    };
  }


  function openDoc (connection, entity) {
    var key = entityMetadataToKey(entity.data.sys);
    var docLoadPromise = $q.denodeify(function (cb) {
      connection.open(key, 'json', cb);
    }).then(function (doc) {
      return DocLoad.Doc(doc);
    }, function (error) {
      return DocLoad.Error(error);
    });

    return {
      docLoad: docLoadPromise,
      close: close
    };

    function close () {
      docLoadPromise.then(closeDoc);
    }
  }


  function closeDoc (doc) {
    caseof(doc, [
      [DocLoad.Doc, function (d) {
        try {
          d.doc.close();
        } catch (e) {
          if (e.message !== 'Cannot send to a closed connection') {
            throw e;
          }
        }
      }],
      [null, _.noop]
    ]);
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
