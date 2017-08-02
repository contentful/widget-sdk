'use strict';

angular.module('contentful').directive('cfViewCustomizer', ['require', 'defer', function (require, defer) {
  var $timeout = require('$timeout');

  return {
    template: JST.view_customizer(),
    restrict: 'A',
    link: function ($scope) {
      $scope.setDisplayField = function (ev, field) {
        ev.stopPropagation();
        $scope.addDisplayField(field);
      };

      $scope.hideField = function (ev, field) {
        ev.stopPropagation();
        $scope.removeDisplayField(field);
      };

      $scope.toggleContentType = function (ev) {
        ev.stopPropagation();
        $scope.context.view.contentTypeHidden = !$scope.context.view.contentTypeHidden;
      };

      $scope.hasHiddenFields = function () {
        return $scope.hiddenFields.length > 0;
      };
    },
    controller: ['$scope', function ($scope) {
      $scope.displayedFieldsSortOptions = {
        axis: 'y',
        cancel: '.close-button',
        containment: '.displayed-fields[ui-sortable]',
        cursor: 'move',
        start: function (_, ui) {
          defer(function () { ui.item.addClass('dragging'); });
        },
        stop: function (_, ui) {
          ui.item.removeClass('dragging');
        },
        update: function () {
          // Ensure that function isn't called before displayedFields is updated
          $timeout(function () {
            var fieldIds = $scope.displayedFields.map(function (field) {
              return field.id;
            });
            $scope.context.view.displayedFieldIds = fieldIds;
          });
        }
      };

      $scope.isActiveDisplayField = function (field) {
        return field.type !== 'Object' && !field.disabled;
      };

      $scope.isPersistent = function (field) {
        var displayedFields = _.reject($scope.displayedFields, {id: field.id});

        return !_.some(displayedFields, 'canPersist');
      };
    }]
  };
}]);
