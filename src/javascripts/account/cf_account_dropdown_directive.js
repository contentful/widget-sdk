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
    $scope.orgId = _.get(TheAccountView.getGoToOrganizationsOrganization(), 'sys.id');
  });

  K.onValueScope($scope, TheAccountView.canShowIntercomLink$, function (canShowIntercomLink) {
    $scope.canShowIntercomLink = canShowIntercomLink;
  });

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
