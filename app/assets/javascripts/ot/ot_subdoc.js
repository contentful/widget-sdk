'use strict';

angular.module('contentful').directive('otSubdoc', function () {
  return {
    restrict: 'AC',
    require: '^otDocFor',
    controller: function ($scope) {
      $scope.$watch('otDoc' , updateSubdoc);
      $scope.$watch('otPath', updateSubdoc, true);
      $scope.$watch('otPathTypes', updateSubdoc, true);

      function updateSubdoc(n,o,scope) {
        if (scope.otDoc && scope.otPath) {
          //console.log('setting otSubdoc', scope.otDoc, scope.otPath);
          var pathUpdated = n === scope.otPath;
          if (pathUpdated && scope.otSubdoc) {
            // if the path has been changed, manipulate path in subdoc
            $scope.otSubdoc.path =  angular.copy(scope.otPath);
            if(scope.otPathTypes){
              $scope.otSubdoc.types =  angular.copy(scope.otPathTypes);
            }
          } else {
            // if the path has been replaced, replace subdoc
            $scope.otSubdoc = scope.otDoc.at(scope.otPath);
          }
        } else {
          scope.otSubdoc = null;
        }
      }

    }
  };
});
