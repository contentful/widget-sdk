'use strict';

angular.module('contentful')

.directive('cfSpaceSelector', function() {
  return {
    template: JST.cf_space_selector(),
    restrict: 'E',
    replace: true,
    controller: 'cfSpaceSelectorController'
  };
})

.controller('cfSpaceSelectorController', ['$scope', '$injector', function cfSpaceSelectorController($scope, $injector) {

  var $rootScope       = $injector.get('$rootScope');
  var analytics        = $injector.get('analytics');
  var spaceContext     = $injector.get('spaceContext');
  var spaceTools       = $injector.get('spaceTools');
  var OrganizationList = $injector.get('OrganizationList');
  var accessChecker    = $injector.get('accessChecker');
  var tokenStore       = $injector.get('tokenStore');

  // load initial spaces:
  tokenStore.getSpaces().then(storeSpaces);
  // subscribe to changes of spaces in token:
  var off = tokenStore.changed.attach(storeSpaces);
  $scope.$on('$destroy', off);
  // group spaces when changed:
  $scope.$watch('spaces', groupSpacesByOrganization);

  $scope.spaceContext = spaceContext;
  $scope.canCreateSpace = accessChecker.canCreateSpace;
  $scope.canCreateSpaceInAnyOrganization = accessChecker.canCreateSpaceInAnyOrganization;
  $scope.clickedSpaceSwitcher = clickedSpaceSwitcher;
  $scope.getOrganizationName = OrganizationList.getName;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;
  $scope.selectSpace = spaceTools.goTo;

  function storeSpaces(tokenOrSpaces) {
    $scope.spaces = _.isArray(tokenOrSpaces) ? tokenOrSpaces : tokenOrSpaces.spaces;
  }

  function groupSpacesByOrganization() {
    $scope.spacesByOrganization = _.groupBy($scope.spaces || [], function(space) {
      return space.data.organization.sys.id;
    });
  }

  function clickedSpaceSwitcher() {
    analytics.track('Clicked Space-Switcher');
  }

  function showCreateSpaceDialog() {
    // @todo move it to service - broadcast is a workaround to isolate scope
    $rootScope.$broadcast('showCreateSpaceDialog');
  }
}]);
