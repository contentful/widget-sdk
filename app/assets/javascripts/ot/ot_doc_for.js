'use strict';

angular.module('contentful').directive('otDocFor', function () {
  return {
    restrict: 'A',
    controller: 'otDocForCtrl'
  };
}).controller('otDocForCtrl', function OtDocForCtrl($scope, $attrs, ShareJS) {
  var remoteOpListener;
  $scope.otDisabled = false;

  function otGetEntity() {
    return $scope.$eval($attrs.otDocFor);
  }

  $scope.$watch(function otDocForEntityWatcher(scope) {
    return !scope.otDisabled && otGetEntity();
  } , function (entity, old, scope) {
    //console.log('otDocFor watch entity old: %o new: %o', old, entity);
    if (entity) {
      ShareJS.open(entity, function(err, doc) {
        if (!err) {
          scope.$apply(function(scope){
            //console.log('otDocFor installing doc %o for entity %o', doc, entity);
            scope.otDoc = doc;
          });
        } else {
          //console.log('otDocFor error opening docfor entity %o', entity);
        }
      });
    } else {
      if (scope.otDoc) {
        scope.otDoc.close();
        scope.otDoc = null;
      }
    }
  });

  $scope.$watch('otDoc', function (otDoc, old, scope) {
    if (old) {
      //console.log('otDocFor Controller watcher removing old listener %o from otDoc %o', remoteOpListener, old);
      old.removeListener(remoteOpListener);
      scope.otDoc = null;
    }
    if (otDoc) {
      remoteOpListener = otDoc.on('remoteop', function(ops) {
        scope.$apply(function(scope) {
          _.each(ops, function (op) {
            scope.$broadcast('otRemoteOp', op);
          });
        });
      });
      //console.log('otDocFor Controller watcher adding listener %o from doc %o', remoteOpListener, doc);
    }
  });

  $scope.otUpdateEntity = function () {
    var entity = otGetEntity();
    if (entity && $scope.otDoc) {
      //console.log('otUpdateEntity did update', entity.data, $scope.otDoc.snapshot);
      entity.update($scope.otDoc.snapshot);
    } else {
      console.warn('otUpdateEntity did not update', entity, $scope.otDoc);
    }
  };

  $scope.$on('$destroy', function (event) {
    var scope = event.currentScope;
    if (scope.otDoc) {
      //console.log('otDocFor Controller destroyed, removing listener and otDoc');
      scope.otDoc.removeListener(remoteOpListener);
      remoteOpListener = null;
      scope.otDoc.close();
      scope.otDoc = null;
    }
  });

});
