'use strict';

angular.module('contentful')

.directive('cfAccountDropdown', ['require', function (require) {
  return {
    template: require('navigation/templates/AccountDropdown.template').default(),
    restrict: 'E',
    scope: {user: '='},
    controller: 'cfAccountDropdownController'
  };
}])

.controller('cfAccountDropdownController', ['$scope', 'require', function ($scope, require) {
  var Authentication = require('Authentication');
  var Config = require('Config');
  var Analytics = require('analytics/Analytics');
  var intercom = require('intercom');

  $scope.userProfileRef = {
    path: ['account', 'profile', 'user'],
    options: { reload: true }
  };

  $scope.supportUrl = Config.supportUrl;
  $scope.openIntercom = intercom.open;
  $scope.isIntercomLoaded = intercom.isLoaded;
  $scope.logout = logout;

  function logout () {
    Analytics.track('global:logout_clicked');
    Analytics.disable();
    Authentication.logout();
  }
}]);
