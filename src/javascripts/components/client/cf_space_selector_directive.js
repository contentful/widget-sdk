'use strict';

angular.module('contentful')

.directive('cfSpaceSelector', function() {
  return {
    template: JST.cf_space_selector(),
    restrict: 'E',
    replace: true,
    scope: {
      organizations: '=',
      spaces: '=',
      permissionController: '=',
      spaceContext: '='
    },
    controller: 'cfSpaceSelectorController'
  };
})

.controller('cfSpaceSelectorController', ['$scope', '$rootScope', 'analytics', function cfSpaceSelectorController($scope, $rootScope, analytics) {
  $scope.$watch('spaces', groupSpacesByOrganization);

  $scope.clickedSpaceSwitcher = clickedSpaceSwitcher;
  $scope.getOrganizationName = getOrganizationName;
  $scope.getCurrentSpaceId = getCurrentSpaceId;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;
  $scope.selectSpace = selectSpace;

  function groupSpacesByOrganization(spaces) {
    $scope.spacesByOrganization = _.groupBy(spaces || [], function(space) {
      return space.data.organization.sys.id;
    });
  }

  function clickedSpaceSwitcher() {
    analytics.track('Clicked Space-Switcher');
  }

  function getOrganizationName(id) {
    var result = _.where($scope.organizations, { sys: { id: id } });
    return result.length > 0 ? result[0].name : '';
  }

  function getCurrentSpaceId() {
    return dotty.get($scope, 'spaceContext.space.data.sys.id', null);
  }

  function showCreateSpaceDialog() {
    // @todo move it to service - broadcast is a workaround to isolate scope
    $rootScope.$broadcast('showCreateSpaceDialog');
  }

  function selectSpace(space) {
    // @todo move it to service - broadcast is a workaround to isolate scope
    $rootScope.$broadcast('selectSpace', space);
    toggleSpaceSelector();
  }

  function toggleSpaceSelector() {
    $rootScope.$broadcast('dropdownToggle', 'navbar.spaceSelector');
  }
}]);
