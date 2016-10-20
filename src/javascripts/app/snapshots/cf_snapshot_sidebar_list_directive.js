'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSnapshotSidebarList
 * @description
 * This directive lacks implementation.
 *
 * The only thing that we want to do is to
 * issue HTTP requests to measure generated
 * backend load.
 *
 * If it'll be low/acceptable then maybe
 * we'll put list of snapshots into the
 * entity sidebar (instead of a button).
 */
.directive('cfSnapshotSidebarList', [function () {
  var PREVIEW_COUNT = 7;

  return {
    restrict: 'E',
    template: '<span />',
    controller: ['$scope', 'spaceContext', function ($scope, spaceContext) {
      var entryId = $scope.entity.getId();
      var query = {limit: PREVIEW_COUNT};

      $scope.isLoading = true;

      spaceContext.cma.getEntrySnapshots(entryId, query)
      .then(function (res) {
        $scope.snapshots = res.items;
        $scope.isLoading = false;
      }, function () {
        // @todo handle errors
      });
    }]
  };
}]);
