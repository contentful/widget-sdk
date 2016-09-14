'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSnapshotList
 */
.directive('cfSnapshotList', ['require', function (require) {
  var snapshotRepo = require('data/entrySnapshots');
  var modalDialog = require('modalDialog');

  var PREVIEW_COUNT = 7;

  return {
    restrict: 'E',
    template: JST.cf_snapshot_list(),
    controller: ['$scope', function ($scope) {
      $scope.isLoading = true;

      snapshotRepo.getList({})
      .then(function (snapshots) {
        $scope.snapshots = snapshots.splice(0, PREVIEW_COUNT);
        $scope.shouldShowSelector = snapshots.total > PREVIEW_COUNT;
        $scope.isLoading = false;
      });

      $scope.openSelector = function () {
        return modalDialog.open({
          template: 'snapshot_selector',
          scopeData: {query: {}}
        }).promise.then(function (_snapshot) {
          // do something with snapshot...
        });
      };
    }]
  };
}]);
