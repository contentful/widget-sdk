'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 */
.directive('cfNavSidepanelTrigger', ['require', function (require) {
  var sidepanelTrigger = require('navigation/Sidepanel/Trigger').default;
  return {
    restrict: 'E',
    template: '<cf-component-bridge component=component>',
    controller: ['$scope', function ($scope) {
      $scope.component = sidepanelTrigger();
    }]
  };
}]);
