'use strict';

angular.module('cf.app')

.controller('SnapshotSelectorController', ['$scope', 'require', function ($scope, require) {
  var snapshotRepo = require('data/entrySnapshots');
  var Paginator = require('Paginator');

  var snapshotsById = {};

  $scope.isLoading = false;
  $scope.paginator = Paginator.create();
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
    var query = _.extend({page: $scope.paginator.getPage()}, $scope.query);
    $scope.isLoading = true;
    return snapshotRepo.getList(query)
    .then(addUniqueAndSort)
    .then(function () {
      $scope.isLoading = false;
    });
  }

  function addUniqueAndSort (snapshots) {
    $scope.paginator.setTotal(snapshots.total);

    snapshots.filter(function (snapshot) {
      return !snapshotsById[snapshot.sys.id];
    }).forEach(function (snapshot) {
      snapshotsById[snapshot.sys.id] = snapshot;
      $scope.snapshots.push(snapshot);
    });
  }
}]);
