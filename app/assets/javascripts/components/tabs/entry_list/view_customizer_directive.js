'use strict';

angular.module('contentful').directive('viewCustomizer', ['defer', function(defer){
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
    controller: ['$scope', function ($scope) {
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

      $scope.isPersistent = function (field) {
        var displayedFields = _.reject($scope.displayedFields, {id: field.id});
        return !_.some(displayedFields, 'canPersist');
      };
    }]
  };
}]);
