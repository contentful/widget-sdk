'use strict';
angular.module('contentful').directive('cfSelection', ['Selection', function(Selection){
  return {
    restrict: 'A',
    link: function($scope, element, attr) {
      $scope.$watch(function isSelectedWatcher(scope) {
        var entity = scope.$eval(attr.cfSelection);
        if (entity) {
          return scope.selection.isSelected(entity);
        } else {
          return scope.selection.mode == Selection.ALL;
        }
      }, function(isSelected) {
        element.prop('checked', isSelected);
      });

      element.click(function(event) {
        event.stopPropagation();
      });

      element.change(function() {
        $scope.$apply(function(scope) {
          var entity = scope.$eval(attr.cfSelection);
          if (entity) {
            if (element.prop('checked')) {
              scope.selection.add(entity);
            } else {
              scope.selection.remove(entity);
            }
          } else {
            if (element.prop('checked')) {
              scope.selection.addAll();
            } else {
              scope.selection.removeAll();
            }
          }
        });
      });

    }
  };
}]);
