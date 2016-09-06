'use strict';

angular.module('cf.app')

.controller('SnapshotSelectorController', ['$scope', 'require', function ($scope, require) {
  var snapshotRepo = require('data/entrySnapshots');
  var Paginator = require('Paginator');

  var snapshotsById = {};

  $scope.isLoading = false;
  $scope.paginator = new Paginator();
  $scope.loadMore = loadMore;

  resetAndLoad();

  function resetAndLoad () {
    snapshotsById = {};
    $scope.snapshots = [];
    $scope.paginator.numEntries = 0;
    $scope.paginator.page = 0;
    return load();
  }

  function loadMore () {
    if (!$scope.isLoading && !$scope.paginator.atLast()) {
      $scope.paginator.page += 1;
      load();
    }
  }

  function load () {
    var query = _.extend({page: $scope.paginator.page}, $scope.query);
    $scope.isLoading = true;
    return snapshotRepo.getList(query)
    .then(addUniqueAndSort)
    .then(function () {
      $scope.isLoading = false;
    });
  }

  function addUniqueAndSort (snapshots) {
    $scope.paginator.numEntries = snapshots.total;

    snapshots.filter(function (snapshot) {
      return !snapshotsById[snapshot.sys.id];
    }).forEach(function (snapshot) {
      snapshotsById[snapshot.sys.id] = snapshot;
      $scope.snapshots.push(snapshot);
    });
  }
}]);
