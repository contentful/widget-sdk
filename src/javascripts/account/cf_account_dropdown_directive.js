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

.controller('cfAccountDropdownController', ['$scope', 'require', function cfAccountDropdownController ($scope, require) {

  var $window = require('$window');
  var TheAccountView = require('TheAccountView');
  var authentication = require('Authentication');
  var K = require('utils/kefir');
  var Config = require('Config');
  var analytics = require('analytics/Analytics');
  var intercom = require('intercom');

  $scope.$watch(TheAccountView.canGoToOrganizations, function (canGo) {
    $scope.canGoToOrganizations = canGo;
  });

  K.onValueScope($scope, TheAccountView.canShowIntercomLink$, function (canShowIntercomLink) {
    $scope.canShowIntercomLink = canShowIntercomLink;
  });

  $scope.goToUserProfile = TheAccountView.goToUserProfile;
  $scope.goToOrganizations = TheAccountView.goToOrganizations;
  $scope.openSupport = openSupport;
  $scope.openIntercom = intercom.open;
  $scope.isIntercomLoaded = intercom.isLoaded;
  $scope.logout = logout;

  function openSupport () {
    $window.open(Config.supportUrl);
  }

  function logout () {
    analytics.track('global:logout_clicked');
    authentication.logout();
  }
}]);
