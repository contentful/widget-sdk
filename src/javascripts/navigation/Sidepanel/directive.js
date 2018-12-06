'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc directive
   * @name cfNavSidePanel
   *
   * This directive display the new navigation side panel.
   */
  .directive('cfNavSidepanel', [
    'require',
    require => {
      var $ = require('jquery');
      var $window = require('$window');
      var createController = require('navigation/Sidepanel/DirectiveController.es6').default;

      return {
        restrict: 'E',
        template: '<cf-component-bridge component="component" />',
        scope: {
          sidePanelIsShown: '=isShown'
        },
        controller: [
          '$scope',
          $scope => {
            createController($scope, $($window));
          }
        ]
      };
    }
  ]);
