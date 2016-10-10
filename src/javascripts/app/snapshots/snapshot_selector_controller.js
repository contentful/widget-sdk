'use strict';

angular.module('cf.app')

.controller('SnapshotSelectorController', ['$scope', 'require', function ($scope, require) {
  var snapshotRepo = require('data/entrySnapshots');
  var Paginator = require('Paginator');

  var PER_PAGE = 40;

  var snapshotsById = {};

  $scope.isLoading = false;
  $scope.paginator = Paginator.create(PER_PAGE);
  $scope.loadMore = loadMore;

  resetAndLoad();

  function resetAndLoad () {
    snapshotsById = {};
    $scope.snapshots = [];
    $scope.paginator.setTotal(0);
    $scope.paginator.setPage(0);
    return load();
  }

  function loadMore () {
    if (!$scope.isLoading && !$scope.paginator.isAtLast()) {
      $scope.paginator.next();
      load();
    }
  }

  function load () {
    $scope.isLoading = true;

    return snapshotRepo.getList({
      skip: $scope.paginator.getSkipParam(),
      limit: PER_PAGE + 1
    })
    .then(addUnique)
    .then(function () {
      $scope.isLoading = false;
    });
  }

  function addUnique (snapshots) {
    $scope.paginator.setTotal(function (total) {
      return total + snapshots.length;
    });

    snapshots.slice(0, PER_PAGE).filter(function (snapshot) {
      return !snapshotsById[snapshot.sys.id];
    }).forEach(function (snapshot) {
      snapshotsById[snapshot.sys.id] = snapshot;
      $scope.snapshots.push(snapshot);
    });
  }
}]);
