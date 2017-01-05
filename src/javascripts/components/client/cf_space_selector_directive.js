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
  var K = require('utils/kefir');
  var analytics = require('analytics');
  var spaceContext = require('spaceContext');
  var OrganizationList = require('OrganizationList');
  var accessChecker = require('accessChecker');
  var tokenStore = require('tokenStore');
  var CreateSpace = require('services/CreateSpace');

  // subscribe to changes of spaces in token:
  K.onValueScope($scope, tokenStore.spaces$, storeSpaces);

  // group spaces when changed:
  $scope.$watch('spaces', groupSpacesByOrganization);

  $scope.spaceContext = spaceContext;
  $scope.canCreateSpace = accessChecker.canCreateSpace;
  $scope.canCreateSpaceInAnyOrganization = accessChecker.canCreateSpaceInAnyOrganization;
  $scope.clickedSpaceSwitcher = _.partial(analytics.track, 'space_switcher:opened');
  $scope.getOrganizationName = OrganizationList.getName;
  $scope.showCreateSpaceDialog = CreateSpace.showDialog;
  $scope.trackSpaceChange = trackSpaceChange;

  function storeSpaces (spaces) {
    $scope.spaces = spaces;
  }

  function groupSpacesByOrganization () {
    $scope.spacesByOrganization = _.groupBy($scope.spaces || [], function (space) {
      return space.data.organization.sys.id;
    });
  }

  function trackSpaceChange (space) {
    if (spaceContext.getId() !== space.getId()) {
      analytics.track('space_switcher:space_switched', {
        targetSpaceId: space.getId(),
        targetSpaceName: space.data.name
      });
    }
  }
}]);
