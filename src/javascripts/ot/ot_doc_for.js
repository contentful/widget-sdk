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

  var otConnected = false;

  $scope.otDoc = {
    doc: undefined,
    state: {
      // initialized to true to prevent editing until otDoc is ready
      disabled: true, // otDoc.state.disabled
      editable: false // otDoc.state.editable
    },
    getEntity: otGetEntity,
    updateEntityData: otUpdateEntityData
  };

  $scope.$watch(function () {
    return ShareJS.isConnected();
  }, function (connected) {
    otConnected = connected;
  });

  // If the document connection state changes, this watcher is triggered
  // Connection failures during editing are handled from this point onwards.
  $scope.$watch(function (scope) {
    return isDocUsable(scope) ? otGetEntity() : false;
  }, attemptToOpenOtDoc);

  $scope.$on('otConnectionStateChanged', function () {
    attemptToOpenOtDoc(otGetEntity());
  });

  $scope.$watch('otDoc.doc', function (otDoc, old, scope) {
    setupRemoteOpListeners(otDoc, old);
    scope.otDoc.state.editable = !!otDoc;
  });

  $scope.$watch('otDoc.state.editable', handleEditableState);
  $scope.$on('$destroy', handleScopeDestruction);

  function resetOtDoc() {
    $scope.otDoc.doc = undefined;
  }

  function isDocUsable(scope) {
    return otConnected && !scope.otDoc.state.disabled && !!otGetEntity();
  }

  function otGetEntity() {
    return $scope.$eval($attrs.otDocFor);
  }

  function attemptToOpenOtDoc(entity) {
    if (entity) {
      ShareJS.open(entity, _.partialRight(openOtDocFor, entity));
    } else {
      handleLackOfEntity();
    }
  }

  function handleLackOfEntity() {
    if ($scope.otDoc.doc) {
      closeDoc($scope.otDoc.doc);
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

  function openOtDocFor(err, doc, entity) {
    $scope.$apply(function(scope){
      if(err || !doc){
        handleOtDocOpeningFailure(err, entity);
      } else {
        setupClosedEventHandling(doc);
        if (isDocUsable(scope)) {
          setupOtDoc(doc);
        } else {
          closeDoc(doc);
        }
      }
    });
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

  function setupOtDoc(doc) {
    filterDeletedLocales(doc.snapshot);
    $scope.otDoc.doc = doc;
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
    $scope.otDoc.doc.on('acknowledge', updateHandler);
    $scope.otDoc.doc.on('remoteop', updateHandler);
  }

  function updateHandler(){
    if($scope.otDoc.doc)
      otGetEntity().setVersion($scope.otDoc.doc.version);
  }

  function updateIfValid() {
    // Sanity check to make sure there's actually something in the snapshot
    if ($scope.$eval('otDoc.doc.snapshot.sys.id')) {
      otUpdateEntityData();
    }
  }

  function otUpdateEntityData() {
    var entity = otGetEntity();
    if (entity && $scope.otDoc.doc) {
      var data = _.cloneDeep($scope.otDoc.doc.snapshot);
      if(!data) {
        throw new Error('Failed to update entity: data not available');
      }
      if(!data.sys) {
        throw new Error('Failed to update entity: sys not available');
      }

      if ($scope.otDoc.doc.version > entity.getVersion()) {
        data.sys.updatedAt = moment().toISOString();
      } else {
        data.sys.updatedAt = entity.data.sys.updatedAt;
      }
      data.sys.version = $scope.otDoc.doc.version;
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

  function handleEditableState(editable, old, scope) {
    if (editable) {
      scope.$emit('otBecameEditable', otGetEntity());
    } else {
      scope.$emit('otBecameReadonly', otGetEntity());
    }
  }

  function setupRemoteOpListeners(doc, old) {
    if (old) {
      old.removeListener('remoteop', remoteOpListener);
    }
    if (doc) {
      doc.on('remoteop', remoteOpListener);
    }
  }

  function remoteOpListener(ops) {
    $scope.$apply(function(scope) {
      _.each(ops, function (op) {
        scope.$broadcast('otRemoteOp', op);
      });
    });
  }

  function handleScopeDestruction(event) {
    var scope = event.currentScope;
    if (scope.otDoc.doc) {
      scope.otDoc.doc.removeListener(remoteOpListener);
      remoteOpListener = null;
      closeDoc(scope.otDoc.doc);
    }
  }

}]);
