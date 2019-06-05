import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';
import window from 'utils/ngCompat/window.es6';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfNavSidePanel
   *
   * This directive display the new navigation side panel.
   */
  registerDirective('cfNavSidepanel', [
    'navigation/Sidepanel/DirectiveController.es6',
    ({ default: createController }) => ({
      restrict: 'E',
      template: '<cf-component-bridge component="component" />',
      scope: {
        sidePanelIsShown: '=isShown'
      },
      controller: [
        '$scope',
        $scope => {
          createController($scope, $(window));
        }
      ]
    })
  ]);
}
