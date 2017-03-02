'use strict';

angular.module('contentful')

.directive('cfAccountDropdown', function () {
  return {
    template: JST.cf_account_dropdown(),
    restrict: 'E',
    replace: true, // @todo adjust styles so it's not needed
    scope: {user: '='},
    controller: 'cfAccountDropdownController'
  };
})

.controller('cfAccountDropdownController', ['$scope', '$injector', function cfAccountDropdownController ($scope, $injector) {

  var $window = $injector.get('$window');
  var TheAccountView = $injector.get('TheAccountView');
  var authentication = $injector.get('Authentication');
  var Config = $injector.get('Config');
  var analytics = $injector.get('analytics/Analytics');
  var intercom = $injector.get('intercom');

  $scope.$watch(TheAccountView.canGoToOrganizations, function (canGo) {
    $scope.canGoToOrganizations = canGo;
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
