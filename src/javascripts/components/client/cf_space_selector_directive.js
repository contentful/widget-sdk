'use strict';

angular.module('contentful')

.directive('cfSpaceSelector', function() {
  return {
    template: JST.cf_space_selector(),
    restrict: 'E',
    replace: true,
    scope: {spaces: '='},
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

  $scope.$watch('spaces', groupSpacesByOrganization);

  $scope.spaceContext = spaceContext;
  $scope.canCreateSpace = accessChecker.canCreateSpace;
  $scope.canCreateSpaceInAnyOrganization = accessChecker.canCreateSpaceInAnyOrganization;
  $scope.clickedSpaceSwitcher = clickedSpaceSwitcher;
  $scope.getOrganizationName = OrganizationList.getName;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;
  $scope.selectSpace = spaceTools.goTo;

  function groupSpacesByOrganization(spaces) {
    $scope.spacesByOrganization = _.groupBy(spaces || [], function(space) {
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
