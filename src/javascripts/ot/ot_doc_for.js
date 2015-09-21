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
 * @property {function()} getEntity
 * @property {function()} updateEntityData
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
 * The directive watches several conditions determining if the ShareJS doc should be
 * opened or closed:
 * - connected status of the sharejs service
 * - otDoc.state.disabled flag
 *
 * It also ensures that the version in the entity is always up-to-date
 *
 *  The following describes the initialization flow of this directive
 *  - if doc is connected, not disabled and there is an entity
 *    - attemptToOpenOtDoc
 *      - if entity
 *        - ShareJS.open
 *        - openOtDocFor
 *          - if successful
 *            - setup closed events
 *            - if doc is open
 *              - setupOtDoc
 *               - filterDeletedLocales
 *               - setVersionUpdater
 *               - updateIfValid
 *                 - otUpdateEntityData
 *            - else closeOtDoc
 *          - else handleOtDocOpeningFailure
 *      - else false (not connected or no entity or disabled)
 *        - handleLackOfEntity
 *          - closeOtDoc
 *
 * @property {otDoc} otDoc
 */
.controller('otDocForController', ['$scope', '$attrs', '$injector', function OtDocForController($scope, $attrs, $injector) {

  var ShareJS = $injector.get('ShareJS');
  var logger  = $injector.get('logger');
  var defer   = $injector.get('defer');
  var moment  = $injector.get('moment');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  var otDoc = {
    doc: undefined,
    state: {
      // initialized to true to prevent editing until otDoc is ready
      disabled: true, // otDoc.state.disabled
      editable: false, // otDoc.state.editable
      error: false
    },
    getEntity: otGetEntity,
    updateEntityData: otUpdateEntityData
  };

  $scope.otDoc = otDoc;

  // If the document connection state changes, this watcher is triggered
  // Connection failures during editing are handled from this point onwards.
  $scope.$watch(function (scope) {
    return isDocUsable(scope) ? otGetEntity() : false;
  }, attemptToOpenOtDoc);

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

  $scope.$watch('otDoc.state.editable', handleEditableState);
  $scope.$on('$destroy', handleScopeDestruction);

  function isDocUsable() {
    return ShareJS.isConnected() && !otDoc.state.disabled && !!otGetEntity();
  }

  function otGetEntity() {
    return $scope.$eval($attrs.otDocFor);
  }

  function attemptToOpenOtDoc(entity) {
    if (entity) {
      ShareJS.open(entity)
      .then(function (doc) {
        setupClosedEventHandling(doc);
        if (isDocUsable($scope)) {
          otDoc.state.error = false;
          setupOtDoc(doc);
        } else {
          closeDoc(doc);
        }
      }, function (err) {
        otDoc.state.error = true;
        handleOtDocOpeningFailure(err, entity);
      });
    } else if (otDoc.doc) {
      closeDoc(otDoc.doc);
    }

  }

  function closeDoc(doc) {
    try {
      doc.close();
    } catch(e) {
      if (e.message !== 'Cannot send to a closed connection') {
        throw e;
      }
    } finally {
      resetOtDoc();
    }
  }


  function handleOtDocOpeningFailure(err, entity) {
    resetOtDoc();
    logger.logSharejsError('Failed to open sharejs doc', {
      data: {
        error: err,
        entity: entity
      }
    });
  }

  function setupClosedEventHandling(doc) {
    doc.on('closed', function () { handleDocClosedEvent(this); });
  }

  function handleDocClosedEvent(context) {
    defer(function () {
      context._listeners.length = 0;
      _.each(context._events, function (listeners) {
        listeners.length = 0;
      });
      context = null;
    });
  }


  function resetOtDoc() {
    if (otDoc.doc) {
      removeRemoteOpListener(otDoc.doc);
    }
    delete otDoc.doc;
    otDoc.state.editable = false;
  }


  function setupOtDoc(doc) {
    filterDeletedLocales(doc.snapshot);
    installRemoteOpListener(doc);
    otDoc.doc = doc;
    otDoc.state.editable = true;
    setVersionUpdater();
    updateIfValid();
  }

  function filterDeletedLocales(data) {
    _.keys(data.fields).forEach(function (fieldId) {
      _.keys(data.fields[fieldId]).forEach(function (internal_code) {
        if (!_.find(TheLocaleStore.getPrivateLocales(), { internal_code: internal_code })) {
          delete data.fields[fieldId][internal_code];
        }
      });
    });
    return data;
  }

  function setVersionUpdater() {
    otDoc.doc.on('acknowledge', updateHandler);
    otDoc.doc.on('remoteop', updateHandler);
  }

  function updateHandler () {
    if (otDoc.doc) {
      var entity = otGetEntity();
      entity.setVersion(otDoc.doc.version);
      entity.data.sys.updatedAt = moment().toISOString();
    }
  }

  function updateIfValid() {
    // Sanity check to make sure there's actually something in the snapshot
    if ($scope.$eval('otDoc.doc.snapshot.sys.id')) {
      otUpdateEntityData();
    }
  }

  function otUpdateEntityData() {
    var entity = otGetEntity();
    if (entity && otDoc.doc) {
      var data = _.cloneDeep(otDoc.doc.snapshot);
      if(!data) {
        throw new Error('Failed to update entity: data not available');
      }
      if(!data.sys) {
        throw new Error('Failed to update entity: sys not available');
      }

      if (otDoc.doc.version > entity.getVersion()) {
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

  function handleEditableState(editable) {
    if (editable) {
      $scope.$emit('otBecameEditable', otGetEntity());
    } else {
      $scope.$emit('otBecameReadonly', otGetEntity());
    }
  }

  function installRemoteOpListener (doc) {
    doc.on('remoteop', remoteOpListener);

  }

  function removeRemoteOpListener (doc) {
    doc.removeListener('remoteop', remoteOpListener);
  }

  function remoteOpListener(ops) {
    $scope.$apply(function(scope) {
      _.each(ops, function (op) {
        scope.$broadcast('otRemoteOp', op);
      });
      otUpdateEntityData();
    });
  }

  function handleScopeDestruction() {
    if (otDoc.doc) {
      closeDoc(otDoc.doc);
      resetOtDoc(otDoc.doc);
    }
  }

}]);
