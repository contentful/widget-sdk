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
 * @property {otDoc} otDoc
 */
.controller('otDocForController', ['$scope', '$attrs', '$injector', function OtDocForController($scope, $attrs, $injector) {

  var ShareJS = $injector.get('ShareJS');
  var logger  = $injector.get('logger');
  var defer   = $injector.get('defer');
  var moment  = $injector.get('moment');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  var otConnected = false;

  $scope.otDoc = makeOtDoc();

  $scope.$watch(function () {
    return ShareJS.isConnected();
  }, function (connected) {
    otConnected = connected;
  });

  $scope.$watch(function (scope) {
    return shouldDocBeOpen(scope) ? otGetEntity() : false;
  }, attemptToOpenOtDoc);

  $scope.$watch('otDoc.doc', function (otDoc, old, scope) {
    setupRemoteOpListeners(otDoc, old);
    scope.otDoc.state.editable = !!otDoc;
  });

  $scope.$watch('otDoc.state.editable', handleEditableState);
  $scope.$on('$destroy', handleScopeDestruction);

  function makeOtDoc() {
    return {
      doc: undefined,
      state: {
        // initialized to true to prevent editing until otDoc is ready
        disabled: true, // otDoc.state.disabled
        editable: false // otDoc.state.editable
      },
      getEntity: otGetEntity,
      updateEntityData: otUpdateEntityData
    };
  }

  function otGetEntity() {
    return $scope.$eval($attrs.otDocFor);
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

  function attemptToOpenOtDoc(entity) {
    if (entity) {
      ShareJS.open(entity, _.partialRight(openOtDocFor, entity));
    } else {
      handleLackOfEntity();
    }
  }

  function openOtDocFor(err, doc, entity) {
    $scope.$apply(function(scope){
      if(err || !doc){
        handleOtDocOpeningFailure(err, entity);
        } else {
          setupClosedEventHandling(doc);
          if (shouldDocBeOpen(scope)) {
            setupOtDoc(doc);
          } else {
            handleSecondaryDocFailures(doc);
          }
      }
    });
  }

  function handleOtDocOpeningFailure(err, entity) {
    $scope.otDoc = makeOtDoc();
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

  function handleSecondaryDocFailures(doc) {
    try {
      doc.close();
    } catch(e) {
      if (e.message !== 'Cannot send to a closed connection') {
        throw e;
      }
    }
  }

  function handleLackOfEntity() {
    if ($scope.otDoc.doc) {
      try {
        $scope.otDoc.doc.close();
      } catch(e) {
        if (e.message !== 'Cannot send to a closed connection') {
          throw e;
        }
      } finally {
        $scope.otDoc = makeOtDoc();
      }
    }
  }

  function setupRemoteOpListeners(otDoc, old) {
    if (old) {
      old.removeListener('remoteop', remoteOpListener);
    }
    if (otDoc) {
      otDoc.on('remoteop', remoteOpListener);
    }
  }

  function handleEditableState(editable, old, scope) {
    if (editable) {
      scope.$emit('otBecameEditable', otGetEntity());
    } else {
      scope.$emit('otBecameReadonly', otGetEntity());
    }
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

  function shouldDocBeOpen(scope) {
    var state = scope.otDoc.state;
    return otConnected && !state.disabled && !!otGetEntity();
  }

  function remoteOpListener(ops) {
    $scope.$apply(function(scope) {
      _.each(ops, function (op) {
        scope.$broadcast('otRemoteOp', op);
      });
    });
  }

  function updateIfValid() {
    // Sanity check to make sure there's actually something in the snapshot
    if ($scope.$eval('otDoc.doc.snapshot.sys.id')) {
      otUpdateEntityData();
    }
  }

  function setVersionUpdater() {
    $scope.otDoc.doc.on('acknowledge', updateHandler);
    $scope.otDoc.doc.on('remoteop', updateHandler);
  }

  function updateHandler(){
    if($scope.otDoc.doc)
      otGetEntity().setVersion($scope.otDoc.doc.version);
  }

  function handleScopeDestruction(event) {
    var scope = event.currentScope;
    if (scope.otDoc.doc) {
      scope.otDoc.doc.removeListener(remoteOpListener);
      remoteOpListener = null;
      try {
        scope.otDoc.doc.close();
      } catch(e) {
        if (e.message !== 'Cannot send to a closed connection') throw e;
      } finally {
        scope.otDoc = makeOtDoc();
      }
    }
  }

}]);
