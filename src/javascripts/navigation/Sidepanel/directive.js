import { registerDirective } from 'NgRegistry';

import createController from 'navigation/Sidepanel/DirectiveController';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfNavSidePanel
   *
   * This directive display the new navigation side panel.
   */
  registerDirective('cfNavSidepanel', [
    () => ({
      restrict: 'E',
      template: '<cf-component-bridge component="component" />',

      scope: {
        sidePanelIsShown: '=isShown'
      },

      controller: [
        '$scope',
        $scope => {
          createController($scope);
        }
      ]
    })
  ]);
}
