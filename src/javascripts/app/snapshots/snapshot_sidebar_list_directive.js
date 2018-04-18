'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSnapshotSidebarList
 *
 * @description
 * Directive that renders a list of entry snapshots for comparison
 *
 * @scope.requires {object} otDoc
 *   An instance of 'app/entity_editor/Document'
 * @scope.requires {object} entityInfo
 *   As provided by the entry/asset editor controller
 */
.directive('cfSnapshotSidebarList', ['require', function (require) {
  var K = require('utils/kefir');
  var caseof = require('sum-types').caseof;
  var spaceContext = require('spaceContext');
  var snapshotDecorator = require('app/snapshots/helpers/SnapshotDecorator');
  var snapshotStatus = require('app/snapshots/helpers/SnapshotStatus');
  var template = require('app/snapshots/SnapshotSidebarListTemplates').snapshotSidebarlist;

  return {
    restrict: 'E',
    template: template,
    controller: ['$scope', function ($scope) {
      var PREVIEW_COUNT = 7;

      var entryId = $scope.entityInfo.id;
      var otDoc = $scope.otDoc;

      $scope.snapshotStatus = snapshotStatus;

      var publishedVersion$ = otDoc.sysProperty.map(function (sys) {
        return sys.publishedVersion;
      }).skipDuplicates();

      // Promise property containing the request for the first couple
      // of snapshots
      // We re-request snapshots whenever the documents published
      // version changes.
      var snapshotLoad$ = publishedVersion$.flatMapLatest(function () {
        return K.promiseProperty(
          spaceContext.cma.getEntrySnapshots(entryId, {limit: PREVIEW_COUNT})
          .then(function (res) {
            return res.items;
          })
        );
      }).toProperty();

      // Property that is true whenever a snapshot request is in
      // progress
      var isLoading$ = snapshotLoad$.map(function (load) {
        return caseof(load, [
          [K.PromiseStatus.Pending, _.constant(true)],
          [null, _.constant(false)]
        ]);
      });

      K.onValueScope($scope, isLoading$, function (isLoading) {
        $scope.isLoading = isLoading;
      });

      // Property that is true whenever a snapshot request failed
      var hasError$ = snapshotLoad$.map(function (load) {
        return caseof(load, [
          [K.PromiseStatus.Rejected, _.constant(true)],
          [null, _.constant(false)]
        ]);
      });

      K.onValueScope($scope, hasError$, function (hasError) {
        if (hasError) {
          $scope.errorMessage = 'Failed to load entity snapshots';
        }
      });

      // Extract the snapshots from the request. If the request is in
      // progress we reuse the previously fetched list of snapshots
      var snapshots$ = snapshotLoad$.scan(function (prev, load) {
        return caseof(load, [
          [K.PromiseStatus.Resolved, function (load) {
            return load.value;
          }],
          [null, _.constant(prev)]
        ]);
      }, []);

      // Decorate the snapshot list based on the current entry sys
      // information.
      var decoratedSnapshots$ = K.combineProperties(
        [snapshots$, otDoc.sysProperty],
        function (snapshots, sys) {
          return snapshotDecorator.withCurrent(sys, snapshots);
        });

      K.onValueScope($scope, decoratedSnapshots$, function (snapshots) {
        if (snapshots.length > 1 || (snapshots[0] && !snapshots[0].sys.isCurrent)) {
          $scope.snapshots = snapshots;
        } else {
          $scope.snapshots = null;
        }
      });
    }]
  };
}]);
