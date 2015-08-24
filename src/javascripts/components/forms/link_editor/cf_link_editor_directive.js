'use strict';

angular.module('contentful').directive('cfLinkEditor', [function(){
  return {
    restrict: 'A',
    require: 'ngModel',
    template: JST['cf_link_editor'],
    link: function(scope, elem, attrs, ngModelCtrl) {

      ngModelCtrl.$render = function () {
        if (!angular.equals(ngModelCtrl.$viewValue, scope.links)) {
          scope.links = ngModelCtrl.$viewValue;
        }
      };

      scope.updateModel = function () {
        ngModelCtrl.$setViewValue(scope.links);
      };

      if (scope.linkSingle) {
        ngModelCtrl.$parsers.push(function (viewValue) {
          return viewValue ? viewValue[0] : null;
        });
        ngModelCtrl.$formatters.push(function (modelValue) {
          return modelValue ? [modelValue] : [];
        });
      }

      scope.linkSortOptions = {
        disabled: scope.linkSingle,
        handle: '[cf-drag-handle]',
        cursor: 'move',
        forceHelperSize: true,
        forcePlaceholderSize: true,
        tolerance: 'pointer',
        containment: 'document',
        update: function(e, ui) {
          var oldIndex = ui.item.sortable.index;
          var newIndex = ui.item.sortable.dropindex;
          scope.otDoc.doc.at(scope.otPath).move(oldIndex, newIndex, function() {
            scope.$apply('otDoc.updateEntityData()');
          });
        }
      };

    }
  };
}]);

