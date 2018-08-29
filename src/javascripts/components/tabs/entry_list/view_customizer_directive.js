'use strict';

angular.module('contentful').directive('cfViewCustomizer', [
  'require',
  'defer',
  (require, defer) => {
    const $timeout = require('$timeout');

    return {
      template: JST.view_customizer(),
      restrict: 'A',
      link: function($scope) {
        $scope.setDisplayField = (ev, field) => {
          ev.stopPropagation();
          $scope.addDisplayField(field);
        };

        $scope.hideField = (ev, field) => {
          ev.stopPropagation();
          $scope.removeDisplayField(field);
        };

        $scope.toggleContentType = ev => {
          ev.stopPropagation();
          $scope.context.view.contentTypeHidden = !$scope.context.view.contentTypeHidden;
        };

        $scope.hasHiddenFields = () => $scope.hiddenFields.length > 0;
      },
      controller: [
        '$scope',
        $scope => {
          $scope.displayedFieldsSortOptions = {
            axis: 'y',
            cancel: '.close-button',
            containment: '.displayed-fields[ui-sortable]',
            cursor: 'move',
            start: function(_, ui) {
              defer(() => {
                ui.item.addClass('dragging');
              });
            },
            stop: function(_, ui) {
              ui.item.removeClass('dragging');
            },
            update: function() {
              // Ensure that function isn't called before displayedFields is updated
              $timeout(() => {
                const fieldIds = $scope.displayedFields.map(field => field.id);
                $scope.context.view.displayedFieldIds = fieldIds;
              });
            }
          };

          $scope.isActiveDisplayField = field => field.type !== 'Object' && !field.disabled;

          $scope.isPersistent = field => {
            const displayedFields = _.reject($scope.displayedFields, { id: field.id });

            return !_.some(displayedFields, 'canPersist');
          };
        }
      ]
    };
  }
]);
