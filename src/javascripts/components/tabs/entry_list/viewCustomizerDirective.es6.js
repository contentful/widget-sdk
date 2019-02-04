import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  registerDirective('cfViewCustomizer', [
    '$timeout',
    'defer',
    ($timeout, defer) => ({
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
    })
  ]);
}
