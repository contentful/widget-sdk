'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc directive
   * @name cfNavSidePanel
   *
   * This directive display the new navigation side panel.
   */
  .directive('cfNavSidepanelTrigger', [
    'require',
    require => {
      const sidepanelTrigger = require('navigation/Sidepanel/Trigger.es6').default;
      return {
        restrict: 'E',
        template: '<cf-component-bridge component=sidepanelComponent>',
        scope: {},
        controller: [
          '$scope',
          $scope => {
            $scope.sidepanelComponent = sidepanelTrigger();
          }
        ]
      };
    }
  ]);
