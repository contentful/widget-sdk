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
.directive('cfSnapshotSidebarList', ['require', function (require) {
  var snapshotRepo = require('data/entrySnapshots');

  var PREVIEW_COUNT = 7;

  return {
    restrict: 'E',
    template: '<span style="display: none;">cfSnapshotSidebarList</span>',
    controller: ['$scope', function ($scope) {
      $scope.isLoading = true;

      snapshotRepo.getList({limit: PREVIEW_COUNT})
      .then(function (snapshots) {
        $scope.snapshots = snapshots;
        $scope.isLoading = false;
      });
    }]
  };
}]);
