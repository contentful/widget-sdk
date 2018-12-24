import { registerDirective } from 'NgRegistry.es6';

/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 */
registerDirective('cfNavSidepanelTrigger', [
  'navigation/Sidepanel/Trigger.es6',
  ({ default: sidepanelTrigger }) => ({
    restrict: 'E',
    template: '<cf-component-bridge component=sidepanelComponent>',
    scope: {},
    controller: [
      '$scope',
      $scope => {
        $scope.sidepanelComponent = sidepanelTrigger();
      }
    ]
  })
]);
