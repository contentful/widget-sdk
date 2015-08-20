'use strict';

/**
 * Inside (or on) an otPath component, this directive is used to actually expose an
 * otSubdoc property on the scope that corresponds to the otPath.
 */
angular.module('contentful').directive('otSubdoc', function () {
  return {
    restrict: 'AC',
    require: '^otDocFor',
    controller: ['$scope', function ($scope) {
      $scope.$watch('otDoc.doc' , updateSubdoc);
      $scope.$watch('otPath', updateSubdoc, true);

      function updateSubdoc(n,o,scope) {
        if (scope.otDoc.doc && scope.otPath) {
          var pathUpdated = n === scope.otPath;
          if (pathUpdated && scope.otSubdoc) {
            // if the path has been changed, manipulate path in subdoc
            $scope.otSubdoc.path =  angular.copy(scope.otPath);
          } else {
            // if the path has been replaced, replace subdoc
            $scope.otSubdoc = scope.otDoc.doc.at(scope.otPath);
          }
        } else {
          scope.otSubdoc = null;
        }
      }

    }]
  };
});
