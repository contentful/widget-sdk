'use strict';

angular.module('contentful')

.directive('cfSpaceSelector', function () {
  return {
    template: JST.cf_space_selector(),
    restrict: 'E',
    replace: true,
    controller: 'cfSpaceSelectorController'
  };
})

.controller('cfSpaceSelectorController', ['$scope', 'require', function cfSpaceSelectorController ($scope, require) {
  var $rootScope = require('$rootScope');
  var $state = require('$state');
  var analytics = require('analytics');
  var spaceContext = require('spaceContext');
  var OrganizationList = require('OrganizationList');
  var accessChecker = require('accessChecker');
  var tokenStore = require('tokenStore');

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
  $scope.clickedSpaceSwitcher = _.partial(analytics.track, 'space_switcher:opened');
  $scope.getOrganizationName = OrganizationList.getName;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;
  $scope.selectSpace = selectSpace;

  function storeSpaces (tokenOrSpaces) {
    $scope.spaces = _.isArray(tokenOrSpaces) ? tokenOrSpaces : tokenOrSpaces.spaces;
  }

  function groupSpacesByOrganization () {
    $scope.spacesByOrganization = _.groupBy($scope.spaces || [], function (space) {
      return space.data.organization.sys.id;
    });
  }

  function showCreateSpaceDialog () {
    // @todo move it to service - broadcast is a workaround to isolate scope
    $rootScope.$broadcast('showCreateSpaceDialog');
  }

  function selectSpace (space) {
    if (spaceContext.getId() !== space.getId()) {
      analytics.track('space_switcher:space_switched', {
        targetSpaceId: space.getId(),
        targetSpaceName: space.data.name
      });

      $state.go('spaces.detail', {spaceId: space.getId()});
    }
  }
}]);
