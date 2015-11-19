'use strict';

angular.module('contentful')

.directive('cfAccountDropdown', function() {
  return {
    template: JST.cf_account_dropdown(),
    restrict: 'E',
    replace: true,
    scope: { user: '=' },
    controller: 'cfAccountDropdownController'
  };
})

.controller('cfAccountDropdownController', ['$scope', '$window', '$injector', function cfAccountDropdownController($scope, $window, $injector) {
  var TheAccountView = $injector.get('TheAccountView');
  var authentication = $injector.get('authentication');
  var analytics      = $injector.get('analytics');
  var intercom       = $injector.get('intercom');

  $scope.goToAccount = TheAccountView.goTo;
  $scope.clickedProfileButton = clickedProfileButton;
  $scope.openSupport = openSupport;
  $scope.openIntercom = intercom.open;
  $scope.isIntercomLoaded = intercom.isLoaded;
  $scope.logout = logout;

  function clickedProfileButton() {
    analytics.track('Clicked Profile Button');
  }

  function openSupport() {
    $window.open(authentication.supportUrl());
  }

  function logout() {
    analytics.track('Clicked Logout');
    authentication.logout();
  }
}]);
