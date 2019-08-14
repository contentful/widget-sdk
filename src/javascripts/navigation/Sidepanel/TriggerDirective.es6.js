import { registerDirective } from 'NgRegistry.es6';
import React from 'react';

import SidepanelTrigger from 'navigation/Sidepanel/Trigger.es6';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfNavSidePanel
   *
   * This directive display the new navigation side panel.
   */
  registerDirective('cfNavSidepanelTrigger', [
    () => ({
      restrict: 'E',
      template: '<cf-component-bridge component=sidepanelComponent>',
      scope: {
        onClick: '=toggleSidePanel'
      },

      controller: [
        '$scope',
        $scope => {
          $scope.sidepanelComponent = React.createElement(SidepanelTrigger, {
            onClick: $scope.onClick
          });
        }
      ]
    })
  ]);
}
