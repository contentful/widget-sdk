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
  var analytics = require('analytics/Analytics');
  var spaceContext = require('spaceContext');
  var accessChecker = require('accessChecker');
  var tokenStore = require('tokenStore');
  var CreateSpace = require('services/CreateSpace');

  // subscribe to changes of spaces in token:
  K.onValueScope($scope, tokenStore.spaces$, storeSpaces);
  K.onValueScope($scope, tokenStore.spacesByOrganization$, storeSpacesByOrganization);
  K.onValueScope($scope, tokenStore.organizations$, storeOrganizations);

  $scope.spaceContext = spaceContext;
  $scope.canCreateSpace = accessChecker.canCreateSpace;
  $scope.canCreateSpaceInAnyOrganization = accessChecker.canCreateSpaceInAnyOrganization;
  $scope.clickedSpaceSwitcher = _.partial(analytics.track, 'space_switcher:opened');
  $scope.getOrganizationName = function (id) {
    var org = _.find($scope.organizations, { sys: { id: id } });
    return org && org.name;
  };
  $scope.showCreateSpaceDialog = CreateSpace.showDialog;
  $scope.trackSpaceChange = trackSpaceChange;

  function storeSpaces (spaces) {
    $scope.spaces = spaces;
  }

  function storeSpacesByOrganization (spacesByOrg) {
    $scope.spacesByOrganization = spacesByOrg;
  }

  function storeOrganizations (organizations) {
    $scope.organizations = organizations;
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
