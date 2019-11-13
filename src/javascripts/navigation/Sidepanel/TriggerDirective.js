import { registerDirective } from 'NgRegistry';
import React from 'react';

import SidepanelTrigger from 'navigation/Sidepanel/Trigger';

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
        'spaceContext',
        ($scope, spaceContext) => {
          $scope.sidepanelComponent = React.createElement(SidepanelTrigger, {
            onClick: $scope.onClick,
            spaceContext
          });
        }
      ]
    })
  ]);
}
