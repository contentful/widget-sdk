'use strict';

angular.module('contentful')

/**
 * @ngdoc directive
 * @name otDocFor
 * @description
 * See the otDocForController for more details on what this directive provides
 *
 * @usage[html]
 * <... ot-doc-for="entity">
 */
.directive('otDocFor', function () {
  return {
    restrict: 'A',
    priority: -100,
    controller: 'otDocForController'
  };
})

/**
 * @ngdoc type
 * @name otDoc
 * @property {ShareJSDoc} doc
 * @property {otDoc.state} state
*/

/**
 * @ngdoc type
 * @name otDoc.state
 * @property {boolean} disabled
 * @property {boolean} editable
 * @property {boolean} error
*/

/**
 * @ngdoc type
 * @name otDocForController
 * @description
 * Installs a otDoc property on the scope that corresponds to an entity
 * It emits the following events:
 *
 * - otRemoteOp(op), broadcast:
 *   distribute every incoming remote ot operation to the component
 * - otBecameEditable(entity), emit:
 *   Whenever otDoc.state.editable becomes true
 * - otBecameReadonly(entity), emit:
 *   Whenever otDoc.state.editable becomes false
 *
 * It also ensures that the version in the entity is always up-to-date
 * @property {otDoc} otDoc
 */
.controller('otDocForController', ['$scope', '$attrs', '$injector', function OtDocForController ($scope, $attrs, $injector) {
  var $q = $injector.get('$q');
  var ShareJS = $injector.get('ShareJS');
  var logger = $injector.get('logger');
  var defer = $injector.get('defer');
  var moment = $injector.get('moment');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  var entity = $scope.$eval($attrs.otDocFor);

  var shouldOpen = false;

  var otDoc = {
    doc: undefined,
    state: {
      editable: false,
      error: false,
      saving: false
    },
    getValueAt: getValueAt,
    setValueAt: setValueAt,
    removeValueAt: removeValueAt,
    open: open,
    close: close
  };

  $scope.otDoc = otDoc;

  // If the document connection state changes, this watcher is triggered
  // Connection failures during editing are handled from this point onwards.
  $scope.$watch(function () {
    return shouldOpenDoc();
  }, function (shouldOpen) {
    if (shouldOpen) {
      openDoc();
    } else if (otDoc.doc) {
      closeDoc(otDoc.doc);
    }
  });

  // Watch Doc internals to determine if we have sent operations to the
  // server that have yet to be acknowledged.
  $scope.$watchGroup(['otDoc.doc.inflightOp', 'otDoc.doc.pendingOp'], function (ops) {
    otDoc.state.saving = _.any(ops);
  });

  $scope.$watch(function () {
    return ShareJS.connectionFailed();
  }, function (failed) {
    // We do not want to remove errors that result from failed document
    // opening. Therefore we only set the error to `true` and to to
    // `failed`.
    if (failed) {
      otDoc.state.error = true;
    }
  });

  $scope.$on('$destroy', handleScopeDestruction);

  function getValueAt (path) {
    if (otDoc.doc) {
      return ShareJS.peek(otDoc.doc, path);
    } else {
      return dotty.get(entity.data, path);
    }
  }

  function setValueAt (path, value) {
    if (value === undefined) {
      return removeValueAt(path);
    }
    // TODO this should actually reject when doc is not available
    var doc = otDoc.doc;
    if (doc) {
      // We only test for equality when the value is guaranteed to be
      // equal. Other wise the some properties might have changed.
      if (!_.isObject(value) && value === getValueAt(path)) {
        return $q.resolve(value);
      } else {
        return ShareJS.setDeep(doc, path, value);
      }
    } else {
      return $q.reject(new Error('Cannot set value on document'));
    }
  }

  function removeValueAt (path) {
    return $q.denodeify(function (cb) {
      // We catch synchronous errors since they tell us that a
      // value along the path does not exist.
      // TODO this should actually reject when doc is not available
      try {
        otDoc.doc.removeAt(path, cb);
      } catch (e) {
        cb();
      }
    });
  }

  function open () {
    shouldOpen = true;

  }

  function close () {
    shouldOpen = false;
  }


  function shouldOpenDoc () {
    return ShareJS.isConnected() && shouldOpen;
  }

  function openDoc () {
    ShareJS.open(entity)
    .then(function (doc) {
      setupClosedEventHandling(doc);
      // Check a second time if we have disconnected or the document
      // has been disabled.
      if (shouldOpenDoc()) {
        otDoc.state.error = false;
        setupOtDoc(doc);
      } else {
        closeDoc(doc);
      }
    }, function (err) {
      otDoc.state.error = true;
      handleOtDocOpeningFailure(err, entity);
    });
  }

  function closeDoc (doc) {
    try {
      doc.close();
    } catch (e) {
      if (e.message !== 'Cannot send to a closed connection') {
        throw e;
      }
    } finally {
      resetOtDoc();
    }
  }


  function handleOtDocOpeningFailure (err, entity) {
    resetOtDoc();
    logger.logSharejsError('Failed to open sharejs doc', {
      data: {
        error: err,
        entity: entity
      }
    });
  }

  function setupClosedEventHandling (doc) {
    // Remove all event listeners when the document is closed.
    // TODO I’m not sure this accomplishes what we want. In any case
    // this should be done through the doc’s public API.
    doc.on('closed', function () {
      defer(function () {
        doc._listeners.length = 0;
        _.each(doc._events, function (listeners) {
          listeners.length = 0;
        });
      });
    });
  }

  function resetOtDoc () {
    if (otDoc.doc) {
      removeListeners(otDoc.doc);
    }
    delete otDoc.doc;
    otDoc.state.editable = false;
    $scope.$emit('otBecameReadonly', entity);
  }


  function setupOtDoc (doc) {
    filterDeletedLocales(doc.snapshot);
    filterDeletedFields(doc.snapshot);
    installListeners(doc);
    otDoc.doc = doc;
    otDoc.state.editable = true;
    $scope.$emit('otBecameEditable', entity);
    $scope.$broadcast('otDocReady', doc);
    otUpdateEntityData();
  }

  function filterDeletedLocales (data) {
    _.keys(data.fields).forEach(function (fieldId) {
      _.keys(data.fields[fieldId]).forEach(function (internalCode) {
        if (!_.find(TheLocaleStore.getPrivateLocales(), { internal_code: internalCode })) {
          delete data.fields[fieldId][internalCode];
        }
      });
    });
    return data;
  }

  function filterDeletedFields (data) {
    if (entity.getType() !== 'Entry') {
      return data;
    }

    var ctFields = dotty.get($scope.contentType, 'data.fields');
    if (!ctFields) {
      return data;
    }

    var ctFieldIds = _.map(ctFields, function (field) {
      return field.id;
    });

    _.forEach(data.fields, function (_fieldValue, fieldId) {
      if (ctFieldIds.indexOf(fieldId) < 0) {
        delete data.fields[fieldId];
      }
    });

    return data;
  }

  function updateHandler () {
    if (otDoc.doc) {
      $scope.$apply(function () {
        entity.setVersion(otDoc.doc.version);
        entity.data.sys.updatedAt = moment().toISOString();
      });
    }
  }

  function otUpdateEntityData () {
    if (otDoc.doc) {
      var data = _.cloneDeep(otDoc.doc.snapshot);
      if (!data) {
        throw new Error('Failed to update entity: data not available');
      }
      if (!data.sys) {
        throw new Error('Failed to update entity: sys not available');
      }

      if (otDoc.doc.version > entity.data.sys.version) {
        data.sys.updatedAt = moment().toISOString();
      } else {
        data.sys.updatedAt = entity.data.sys.updatedAt;
      }
      data.sys.version = otDoc.doc.version;
      entity.update(data);
    } else {
      logger.logSharejsError('otUpdateEntityData did not update', {
        data: {
          entity: entity,
          otDoc: $scope.otDoc.doc
        }
      });
    }
  }

  function installListeners (doc) {
    doc.on('remoteop', remoteOpListener);
    doc.on('change', broadcastOtChange);
    doc.on('change', applyEntityDataUpdate);
    doc.on('acknowledge', updateHandler);
  }

  function removeListeners (doc) {
    doc.removeListener('remoteop', remoteOpListener);
    doc.removeListener('change', broadcastOtChange);
    doc.removeListener('change', applyEntityDataUpdate);
    doc.removeListener('acknowledge', updateHandler);
  }

  function remoteOpListener (ops) {
    $scope.$apply(function (scope) {
      _.each(ops, function (op) {
        scope.$broadcast('otRemoteOp', op);
      });
    });
  }

  function broadcastOtChange (op) {
    // The 'change' event on a document may be called synchronously
    // from inside the Angular loop. For instance when a directive
    // changes the document. We therefore must use `$applyAsync()`
    // instead of `$apply()`.
    $scope.$applyAsync(function () {
      $scope.$broadcast('otChange', $scope.otDoc.doc, op);
    });
  }

  function applyEntityDataUpdate () {
    // See comment above for use of `$applyAsync()`
    $scope.$applyAsync(otUpdateEntityData);
  }

  function handleScopeDestruction () {
    if (otDoc.doc) {
      closeDoc(otDoc.doc);
      resetOtDoc(otDoc.doc);
    }
  }

}]);
