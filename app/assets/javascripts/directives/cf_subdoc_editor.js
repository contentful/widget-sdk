'use strict';

angular.module('contentful/directives').directive('cfSubdocEditor', function(ShareJS) {

  return {
    restrict: 'A',
    scope: {
      doc: '=',
      pathString: '@cfSubdocEditor',
      value: '='
    },
    link: function($scope, elm, attr) {
      $scope.editable = !!$scope.doc;

      $scope.$watch(function(scope) {
        return scope.$parent.$eval(scope.pathString);
      }, function(path, old, scope) {
        scope.path = path;
      }, true);

      $scope.$watch('doc', function updateDoc(doc, old ,scope) {
        if (old && old !== doc) {
          old.removeListener(scope.docListener);
          scope.docListener = null;
        }

        if (doc){
          scope.docListener = doc.at([]).on('child op', function(path) {
            if (angular.equals(path, scope.path)) {
              //if (op.oi) {
                //scope.$broadcast('valueReceived', op.oi);//value = op.oi;
              //}
              scope.$apply(function(scope) {
                scope.$broadcast('valueChanged', doc.getAt(scope.path));
              });
            }
          });
          var value = ShareJS.peek(scope.doc, scope.path);
          scope.$broadcast('valueChanged', value);
          scope.editable = true;
        } else {
          scope.$broadcast('valueChanged', scope.value);
          scope.editable = false;
        }
      });
      
      $scope.changeValue = function(value, callback) {
        if ($scope.doc) {
          try {
            $scope.doc.setAt($scope.path, value, callback);
          } catch(e) {
            ShareJS.mkpath($scope.doc, $scope.path, value, callback);
          }
        } else {
          console.error('No doc to push %o to', value);
        }
      };
    }
  };
});
