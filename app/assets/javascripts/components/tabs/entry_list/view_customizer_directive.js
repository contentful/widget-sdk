'use strict';

angular.module('contentful').directive('viewCustomizer', function(){
  return {
    template: JST.view_customizer(),
    restrict: 'C',
    controller: 'ViewCustomizerCtrl',
    link: function (scope, elem) {

      elem.find('.displayed-fields').sortable({
        axis: 'y',
        cancel: '.close-button',
        containment: '.displayed-fields',
        cursor: 'move',
        items: 'li',
        start: function (ev, ui) {
          ui.item.startIndex = ui.item.index();
          ui.item.addClass('dragging');
        },
        stop: function (ev, ui) {
          ui.item.removeClass('dragging');
        },
        update: function (ev, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = ui.item.index();
          delete ui.item.startIndex;
          scope.$apply(function(){
            var currentItem = scope.displayedFields[oldIndex];
            var replacedItem = scope.displayedFields[newIndex];
            scope.displayedFields[newIndex] = currentItem;
            scope.displayedFields[oldIndex] = replacedItem;
          });
        }
      });

      scope.displayField = function (ev, fieldId) {
        ev.stopPropagation();
        scope.addDisplayField(fieldId);
      };

      scope.hideField = function (ev, fieldId) {
        ev.stopPropagation();
        scope.removeDisplayField(fieldId);
      };
    }
  };
});
