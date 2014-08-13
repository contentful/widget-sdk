angular.module('contentful').directive('cfLinkEditor', ['mimetype', function(mimetype){
  'use strict';

  return {
    restrict: 'A',
    require: 'ngModel',
    template: JST['cf_link_editor'],
    controller: 'cfLinkEditorCtrl',
    link: function(scope, elem, attrs, ngModelCtrl) {

      ngModelCtrl.$render = function () {
        if (!angular.equals(ngModelCtrl.$viewValue, scope.links)) {
          scope.links = ngModelCtrl.$viewValue;
        }
      };

      // TODO move this into the controller for gods sake
      scope.linkType     = scope.$eval(attrs.cfLinkEditor);
      scope.fetchMethod  = scope.linkType === 'Entry' ? 'getEntries' : 'getAssets';

      scope.linkMultiple = !!attrs.linkMultiple;
      scope.linkSingle   = !scope.linkMultiple;

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
        handle: '.drag-handle',
        forceHelperSize: true,
        update: function(e, ui) {
          var oldIndex = ui.item.sortable.index;
          var newIndex = ui.item.sortable.dropindex;
          scope.otDoc.at(scope.otPath).move(oldIndex, newIndex, function() {
            scope.$apply('otUpdateEntity()');
          });
        }
      };

    }
  };
}]);

