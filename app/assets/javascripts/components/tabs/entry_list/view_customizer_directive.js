'use strict';

angular.module('contentful').directive('viewCustomizer', function(defer){
  return {
    template: JST.view_customizer(),
    restrict: 'C',
    link: function (scope) {
      scope.displayField = function (ev, field) {
        ev.stopPropagation();
        scope.addDisplayField(field);
      };

      scope.hideField = function (ev, field) {
        ev.stopPropagation();
        scope.removeDisplayField(field);
      };
    },
    controller: function ($scope) {
      $scope.displayedFieldsSortOptions = {
        axis: 'y',
        cancel: '.close-button',
        containment: '.displayed-fields[ui-sortable]',
        cursor: 'move',
        start: function (ev, ui) {
          defer(function () { ui.item.addClass('dragging'); });
        },
        stop: function (ev, ui) {
          ui.item.removeClass('dragging');
        },
      };
    }
  };
});
