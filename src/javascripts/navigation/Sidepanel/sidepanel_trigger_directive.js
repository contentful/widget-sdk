'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 */
.directive('cfNavSidepanelTrigger', ['require', function (require) {
  var K = require('utils/kefir');
  var caseof = require('libs/sum-types').caseof;
  var NavStates = require('navigation/NavState').NavStates;
  var navState$ = require('navigation/NavState').navState$;
  var template = require('navigation/Sidepanel/SidepanelTrigger.template').default();
  var LD = require('utils/LaunchDarkly');

  var ENVIRONMENTS_FLAG_NAME = 'feature-dv-11-2017-environments';

  return {
    restrict: 'E',
    template: template,
    scope: {},
    replace: true,
    controller: ['$scope', function ($scope) {
      var navState;
      K.onValueScope($scope, navState$, function (value) {
        navState = value;
        update();
      });

      var environmentsEnabled;
      LD.onFeatureFlag($scope, ENVIRONMENTS_FLAG_NAME, function (isEnabled) {
        environmentsEnabled = isEnabled;
        update();
      });

      function update () {
        if (navState) {
          caseof(navState, [
            [NavStates.Space, function () {
              var space = navState.space;
              $scope.title = space.name;
              $scope.subtitle = navState.org.name;

              if (environmentsEnabled && space.spaceMembership.admin) {
                var env = navState.env;
                $scope.env = env ? env.sys.id : 'master';
              } else {
                $scope.env = undefined;
              }
            }],
            [NavStates.OrgSettings, function () {
              $scope.title = 'Organization settings';
              $scope.subtitle = navState.org.name;
              $scope.env = undefined;
            }],
            [NavStates.NewOrg, function () {
              $scope.title = 'Create new organization';
              $scope.subtitle = undefined;
              $scope.env = undefined;
            }],
            [NavStates.UserProfile, function () {
              $scope.title = 'User profile';
              $scope.subtitle = undefined;
              $scope.env = undefined;
            }],
            [NavStates.Default, function () {
              $scope.title = 'Welcome to Contentful';
              $scope.subtitle = undefined;
              $scope.env = undefined;
            }]
          ]);
        }
      }
    }]
  };
}]);
