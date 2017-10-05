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
  var TheAccountView = require('TheAccountView');
  var authentication = require('Authentication');
  var K = require('utils/kefir');
  var Config = require('Config');
  var analytics = require('analytics/Analytics');
  var intercom = require('intercom');

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
