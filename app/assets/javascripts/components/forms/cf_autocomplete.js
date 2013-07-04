angular.module('contentful').directive('cfAutocomplete', function(){
  'use strict';

  return {
    restrict: 'A',
    require: 'ngModel',
    template: JST['cf_autocomplete'],
    link: function(scope, elem, attrs, ngModelCtrl) {
      ngModelCtrl.$render = function () {
        if (!angular.equals(ngModelCtrl.$viewValue, scope.links)) {
          scope.links = ngModelCtrl.$viewValue;
        }
      };

      scope.updateModel = function () {
        ngModelCtrl.$setViewValue(scope.links);
      };

      if (attrs.cfAutocomplete !== 'entries') {
        ngModelCtrl.$parsers.push(function (viewValue) {
          return viewValue ? viewValue[0] : null;
        });
        ngModelCtrl.$formatters.push(function (modelValue) {
          return modelValue ? [modelValue] : [];
        });
      }

      if (attrs.cfAutocomplete === 'entries') {
        var list = elem.find('ul.links').eq(0);
        list.sortable({
          handle: '.drag-handle',
          forceHelperSize: true,
          start: function(event, ui) {
            list.sortable('refresh');
            ui.item.startIndex = ui.item.index();
          },
          update: function(e, ui) {
            var oldIndex = ui.item.startIndex;
            var newIndex = ui.item.index();
            delete ui.item.startIndex;
            scope.otDoc.at(scope.otPath).move(oldIndex, newIndex, function(err) {
              if (err) {
                // undo DOM move operation
                if (oldIndex < newIndex){
                  $(ui.item).insertBefore(list.children().at(oldIndex));
                } else {
                  $(ui.item).insertAfter(list.children().at(oldIndex));
                }
              } else {
                // TODO instead use the ngModelController.$setviewValue
                scope.$apply('otUpdateEntity()');
              }
            });
          }
        });
      }
    },
    controller: 'cfAutocompleteCtrl'
  };
});

