angular.module('contentful/services').directive('otDocFor', function (ShareJS) {
  'use strict';

  return {
    restrict: 'A',
    link: function (scope, elem, attr) {
      scope.otGetEntity = function () {
        return scope.$eval(attr['otDocFor']);
      };
    },

    controller: function ($scope) {
      // TODO refactor all related files to use otDoc instead of doc

      var remoteOpListener;
      $scope.otDisabled = false;

      $scope.$watch(function (scope) {
        return !scope.otDisabled && scope.otGetEntity();
      } , function (entity, old, scope) {
        console.log('otDocFor watch entity old: %o new: %o', old, entity);
        if (entity) {
          ShareJS.open(entity, function(err, doc) {
            if (!err) {
              scope.$apply(function(scope){
                console.log('otDocFor installing doc %o for entity %o', doc, entity);
                scope.doc = doc;
              });
            } else {
              console.log('otDocFor error opening docfor entity %o', entity);
            }
          });
        } else {
          if (scope.doc) {
            scope.doc.close();
            scope.doc = null;
          }
        }
      });

      $scope.$watch('doc', function (doc, old, scope) {
        if (old) {
          console.log('otDocFor Controller watcher removing old listener %o from doc %o', remoteOpListener, old);
          old.removeListener(remoteOpListener);
          scope.doc = null;
        }
        if (doc) {
          remoteOpListener = doc.on('remoteop', function(op) {
            scope.$apply(function(scope) {
              scope.$broadcast('otRemoteOp', op);
            });
          });
          console.log('otDocFor Controller watcher adding listener %o from doc %o', remoteOpListener, doc);
        }
      });

      $scope.otUpdateEntity = function () {
        var entity = $scope.otGetEntity();
        if (entity && $scope.doc) {
          console.log('otUpdateEntity did update', entity.data, $scope.doc.snapshot);
          entity.update($scope.doc.snapshot);
        } else {
          console.warn('otUpdateEntity did not update', entity, $scope.doc);
        }
      };

      $scope.$on('$destroy', function (event) {
        var scope = event.currentScope;
        if (scope.doc) {
          console.log('otDocFor Controller destroyed, removing listener and doc');
          scope.doc.removeListener(remoteOpListener);
          remoteOpListener = null;
          scope.doc.close();
          scope.doc = null;
        }
      });

    }
  };
});
