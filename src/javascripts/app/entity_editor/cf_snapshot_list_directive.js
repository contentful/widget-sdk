'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSnapshotList
 */
.directive('cfSnapshotList', ['require', function (require) {
  var snapshotRepo = require('data/entrySnapshots');

  return {
    restrict: 'E',
    template: JST.cf_snapshot_list(),
    controller: ['$scope', function ($scope) {
      snapshotRepo.getList()
      .then(function (snapshots) {
        $scope.snapshots = snapshots;
      });
    }]
  };
}]);
