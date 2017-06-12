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
  var tokenStore = require('services/TokenStore');
  var CreateSpace = require('services/CreateSpace');

  // subscribe to changes in token:
  K.onValueScope($scope, tokenStore.spaces$, function (spaces) {
    $scope.spaces = spaces;
  });
  K.onValueScope($scope, tokenStore.spacesByOrganization$, function (spacesByOrg) {
    $scope.spacesByOrganization = spacesByOrg;
  });
  K.onValueScope($scope, tokenStore.organizations$, function (organizations) {
    $scope.organizations = organizations;
  });

  $scope.spaceContext = spaceContext;
  $scope.canCreateSpace = accessChecker.canCreateSpace;
  $scope.canCreateSpaceInAnyOrganization = accessChecker.canCreateSpaceInAnyOrganization;
  $scope.clickedSpaceSwitcher = _.partial(analytics.track, 'space_switcher:opened');
  $scope.getOrganizationName = function (id) {
    return _.get(_.find($scope.organizations, { sys: { id: id } }), 'name');
  };
  $scope.showCreateSpaceDialog = CreateSpace.showDialog;
  $scope.trackSpaceChange = trackSpaceChange;

  function trackSpaceChange (space) {
    if (spaceContext.getId() !== space.getId()) {
      analytics.track('space_switcher:space_switched', {
        targetSpaceId: space.getId(),
        targetSpaceName: space.data.name
      });
    }
  }
}]);
