'use strict';

angular.module('contentful').directive('otDocFor', function () {
  return {
    restrict: 'A',
    controller: 'otDocForCtrl'
  };
}).controller('otDocForCtrl', function OtDocForCtrl($scope, $attrs, ShareJS) {
  function remoteOpListener(ops) {
    $scope.$apply(function(scope) {
      _.each(ops, function (op) {
        scope.$broadcast('otRemoteOp', op);
      });
    });
  }

  $scope.otDisabled = false; // set to true to prevent editing
  $scope.otEditable = false; // indicates editability

  function otGetEntity() {
    return $scope.$eval($attrs.otDocFor);
  }

  $scope.$watch(function () {
    return ShareJS.connection.state == 'ok';
  }, function (connected, old, scope) {
    scope.otConnected = connected;
  });

  $scope.$watch(function otDocForEntityWatcher(scope) {
    return !scope.otDisabled && scope.otConnected && otGetEntity();
  } , function (entity, old, scope) {
    //console.log('otDocFor watch entity old: %o new: %o', old, entity);
    if (entity) {
      ShareJS.open(entity, function(err, doc) {
        scope.$apply(function(scope){
          if (!err) {
              //console.log('otDocFor installing doc %o for entity %o', doc.state, doc, entity);
              scope.otDoc = doc;
              //console.log('setting doc to %o (id: %o) in scope %o', doc.name, doc.snapshot.sys.id, scope.$id);
          } else {
            scope.otDoc = null;
            //console.log('otDocFor error opening docfor entity %o', doc.state, doc, entity);
          }
        });
      });
    } else {
      if (scope.otDoc) {
        //console.log('setting doc to null %o (id: %o) in scope %o', scope.otDoc.name, scope.otDoc.snapshot.sys.id, scope.$id);
        try {
          scope.otDoc.close();
        } finally {
          scope.otDoc = null;
        }
      }
    }
  });

  $scope.$watch('otDoc', function (otDoc, old, scope) {
    if (old) {
      old.removeListener('remoteOp', remoteOpListener);
    }
    if (otDoc) {
      otDoc.on('remoteop', remoteOpListener);
    }
    scope.otEditable = !!otDoc;
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
