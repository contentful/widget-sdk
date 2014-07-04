'use strict';

angular.module('contentful').directive('otDocFor', function () {
  return {
    restrict: 'A',
    priority: -100,
    controller: 'otDocForCtrl'
  };
}).controller('otDocForCtrl', ['$scope', '$attrs', 'ShareJS', 'sentry', 'defer', function OtDocForCtrl($scope, $attrs, ShareJS, sentry, defer) {
  function remoteOpListener(ops) {
    $scope.$apply(function(scope) {
      _.each(ops, function (op) {
        scope.$broadcast('otRemoteOp', op);
      });
    });
  }

  $scope.otDisabled = true; // set to true to prevent editing
  $scope.otEditable = false; // indicates editability

  function otGetEntity() {
    return $scope.$eval($attrs.otDocFor);
  }
  $scope.otGetEntity = otGetEntity;

  $scope.$watch(function () {
    return ShareJS.isConnected();
  }, function (connected, old, scope) {
    scope.otConnected = connected;
  });

  function shouldDocBeOpen(scope) {
    //console.log('otDocFor shouldDocBeOpen disabled %o, connected %o, entity %o', scope.otDisabled, scope.otConnected, otGetEntity() );
    return scope.otConnected && !scope.otDisabled && !!otGetEntity();
  }

  $scope.$watch(function (scope) {
    return shouldDocBeOpen(scope) ? otGetEntity() : false;
  } , function (entity, old, scope) {
    if (entity) {
      ShareJS.open(entity, function(err, doc) {
        scope.$apply(function(scope){
          if(err || !doc){
            scope.otDoc = null;
            sentry.captureError('Failed to open sharejs doc', {
              data: {
                entity: entity,
                err: err
              }
            });
          } else {
              doc.on('closed', function () {
                // TODO this is dangerous! We could be removing listeners that are still needed
                var d = this;
                defer(function () {
                  d._listeners.length = 0;
                  _.each(d._events, function (listeners) {
                    listeners.length = 0;
                  });
                  d = null;
                });
              });
              if (shouldDocBeOpen(scope)) {
                //console.log('otDocFor installing doc %o for entity %o', doc, entity);
                //console.log('setting doc to %o (id: %o) in scope %o', doc.name, doc.snapshot.sys.id, scope.$id);
                scope.otDoc = doc;
                setVersionUpdater();
                updateIfValid();
              } else {
                try {
                  doc.close();
                } catch(e) {
                  if (e.message !== 'Cannot send to a closed connection') throw e;
                }
              }
          }
        });
      });
    } else {
      if (scope.otDoc) {
        //console.log('setting doc to null %o (id: %o) in scope %o', scope.otDoc.name, scope.otDoc.snapshot.sys.id, scope.$id);
        try {
          scope.otDoc.close();
        } catch(e) {
          if (e.message !== 'Cannot send to a closed connection') throw e;
        } finally {
          scope.otDoc = null;
        }
      }
    }
  });

  $scope.$watch('otDoc', function (otDoc, old, scope) {
    if (old) {
      old.removeListener('remoteop', remoteOpListener);
    }
    if (otDoc) {
      otDoc.on('remoteop', remoteOpListener);
    }
    scope.otEditable = !!otDoc;
  });

  $scope.$watch('otEditable', function (editable, old, scope) {
    if (editable) {
      scope.$emit('otBecameEditable', otGetEntity());
    } else {
      scope.$emit('otBecameReadonly', otGetEntity());
    }
  });

  $scope.otUpdateEntity = function (entity) {
    entity = entity || otGetEntity();
    if (entity && $scope.otDoc) {
      var data = _.cloneDeep($scope.otDoc.snapshot);
      if(!data) {
        throw new Error('Failed to update entity: data not available');
      }
      if(!data.sys) {
        throw new Error('Failed to update entity: sys not available');
      }

      data.sys.version = $scope.otDoc.version;
      data.sys.updatedAt = moment().toISOString();
      entity.update(data);
    } else {
      sentry.captureError('otUpdateEntity did not update', {
        data: {
          entity: entity,
          otDoc: $scope.otDoc
        }
      });
    }
  };

  $scope.$on('$destroy', function (event) {
    var scope = event.currentScope;
    if (scope.otDoc) {
      scope.otDoc.removeListener(remoteOpListener);
      remoteOpListener = null;
      try {
        scope.otDoc.close();
      } catch(e) {
        if (e.message !== 'Cannot send to a closed connection') throw e;
      } finally {
        scope.otDoc = null;
      }
    }
  });

  function updateIfValid() {
    // Sanity check to make sure there's actually something in the snapshot
    if ($scope.$eval('otDoc.snapshot.sys.id')) {
      $scope.otUpdateEntity();
    }
  }

  function updateHandler(){
    $scope.otGetEntity().setVersion($scope.otDoc.version);
  }

  function setVersionUpdater() {
    $scope.otDoc.on('acknowledge', updateHandler);
    $scope.otDoc.on('remoteop', updateHandler);
  }

}]);
