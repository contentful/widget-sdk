'use strict';

angular.module('contentful').directive('viewCustomizer', function(){
  return {
    template: JST.view_customizer(),
    restrict: 'C',
    controller: 'ViewCustomizerCtrl',
    link: function (scope, elem) {

      // Index is always -1 because of fixed items in list
      function getIndex(ui) {
        return ui.item.index() - 1;
      }

      elem.find('.displayed-fields').sortable({
        axis: 'y',
        cancel: '.close-button',
        containment: '.displayed-fields',
        cursor: 'move',
        items: 'li[data-field-id]',
        start: function (ev, ui) {
          ui.item.startIndex = getIndex(ui);
          ui.item.addClass('dragging');
        },
        stop: function (ev, ui) {
          ui.item.removeClass('dragging');
        },
        update: function (ev, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = getIndex(ui);
          delete ui.item.startIndex;
          scope.$apply(function(){
            var list = scope.displayedFields;
            list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
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
