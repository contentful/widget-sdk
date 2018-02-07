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
  var template = require('navigation/templates/SidepanelTrigger.template').default();
  var spaceContext = require('spaceContext');

  return {
    restrict: 'E',
    template: template,
    scope: {},
    replace: true,
    controller: ['$scope', function ($scope) {
      K.onValueScope($scope, navState$, function (navState) {
        caseof(navState, [
          [NavStates.Space, function () {
            var envId = _.get(spaceContext, ['space', 'environment', 'sys', 'id']);
            var envLabel = envId ? (' (env: ' + envId + ')') : '';
            $scope.title = navState.space.name + envLabel;
            $scope.subtitle = 'in ' + navState.org.name;
          }],
          [NavStates.OrgSettings, function () {
            $scope.title = 'Organization settings';
            $scope.subtitle = 'in ' + navState.org.name;
          }],
          [NavStates.NewOrg, function () {
            $scope.title = 'Create new organization';
            $scope.subtitle = undefined;
          }],
          [NavStates.UserProfile, function () {
            $scope.title = 'User profile';
            $scope.subtitle = undefined;
          }],
          [NavStates.Default, function () {
            $scope.title = 'Welcome to Contentful';
            $scope.subtitle = undefined;
          }]
        ]);
      });
    }]
  };
}]);
