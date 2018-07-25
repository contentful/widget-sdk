'use strict';

angular.module('contentful')

.directive('cfAccountDropdown', ['require', require => ({
  template: require('navigation/templates/AccountDropdown.template').default(),
  restrict: 'E',
  scope: {user: '='},
  controller: 'cfAccountDropdownController'
})])

.controller('cfAccountDropdownController', ['$scope', 'require', ($scope, require) => {
  const Authentication = require('Authentication');
  const Config = require('Config');
  const Analytics = require('analytics/Analytics');
  const intercom = require('intercom');
  const $state = require('$state');

  $scope.userProfileRef = {
    path: ['account', 'profile', 'user'],
    options: { reload: true }
  };

  $scope.supportUrl = Config.supportUrl;
  $scope.isIntercomLoaded = intercom.isLoaded;
  $scope.logout = logout;
  $scope.talkToUsClicked = () => {
    Analytics.track('element:click', {
      elementId: 'contact_sales_dropdown',
      groupId: 'contact_sales',
      fromState: $state.current.name
    });
    intercom.open();
  };

  function logout () {
    Analytics.track('global:logout_clicked');
    Analytics.disable();
    Authentication.logout();
  }
}]);
