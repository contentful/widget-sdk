'use strict';

angular.module('contentful')

.directive('cfAccountDropdown', function () {
  return {
    template: JST.cf_account_dropdown(),
    restrict: 'E',
    scope: {user: '='},
    controller: 'cfAccountDropdownController'
  };
})

.controller('cfAccountDropdownController', ['$scope', 'require', function ($scope, require) {
  var TheAccountView = require('TheAccountView');
  var authentication = require('Authentication');
  var K = require('utils/kefir');
  var Config = require('Config');
  var analytics = require('analytics/Analytics');
  var intercom = require('intercom');

  // Begin feature flag code - feature-bv-06-2017-use-new-navigation
  var LD = require('utils/LaunchDarkly');
  LD.setOnScope($scope, 'feature-bv-06-2017-use-new-navigation', 'useNewNavigation');
  // End feature flag code - feature-bv-06-2017-use-new-navigation

  $scope.$watch(function () {
    return TheAccountView.getOrganizationRef();
  }, function (ref) {
    $scope.organizationsRef = ref;
  }, true);

  K.onValueScope($scope, TheAccountView.canShowIntercomLink$, function (canShowIntercomLink) {
    $scope.canShowIntercomLink = canShowIntercomLink;
  });

  $scope.userProfileRef = {
    path: ['account', 'profile', 'user'],
    options: { reload: true }
  };

  $scope.supportUrl = Config.supportUrl;
  $scope.openIntercom = intercom.open;
  $scope.isIntercomLoaded = intercom.isLoaded;
  $scope.logout = logout;

  function logout () {
    analytics.track('global:logout_clicked');
    authentication.logout();
  }
}]);
