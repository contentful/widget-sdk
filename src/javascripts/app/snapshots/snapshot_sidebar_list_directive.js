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
.directive('cfSnapshotSidebarList', ['require', require => {
  var K = require('utils/kefir');
  var caseof = require('sum-types').caseof;
  var spaceContext = require('spaceContext');
  var snapshotDecorator = require('app/snapshots/helpers/SnapshotDecorator');
  var snapshotStatus = require('app/snapshots/helpers/SnapshotStatus');
  var template = require('app/snapshots/SnapshotSidebarListTemplates').snapshotSidebarlist;

  return {
    restrict: 'E',
    template: template,
    controller: ['$scope', $scope => {
      var PREVIEW_COUNT = 7;

      var entryId = $scope.entityInfo.id;
      var otDoc = $scope.otDoc;

      $scope.snapshotStatus = snapshotStatus;

      var publishedVersion$ = otDoc.sysProperty.map(sys => sys.publishedVersion).skipDuplicates();

      // Promise property containing the request for the first couple
      // of snapshots
      // We re-request snapshots whenever the documents published
      // version changes.
      var snapshotLoad$ = publishedVersion$.flatMapLatest(() => K.promiseProperty(
        spaceContext.cma.getEntrySnapshots(entryId, {limit: PREVIEW_COUNT})
        .then(res => res.items)
      )).toProperty();

      // Property that is true whenever a snapshot request is in
      // progress
      var isLoading$ = snapshotLoad$.map(load => caseof(load, [
        [K.PromiseStatus.Pending, _.constant(true)],
        [null, _.constant(false)]
      ]));

      K.onValueScope($scope, isLoading$, isLoading => {
        $scope.isLoading = isLoading;
      });

      // Property that is true whenever a snapshot request failed
      var hasError$ = snapshotLoad$.map(load => caseof(load, [
        [K.PromiseStatus.Rejected, _.constant(true)],
        [null, _.constant(false)]
      ]));

      K.onValueScope($scope, hasError$, hasError => {
        if (hasError) {
          $scope.errorMessage = 'Failed to load entity snapshots';
        }
      });

      // Extract the snapshots from the request. If the request is in
      // progress we reuse the previously fetched list of snapshots
      var snapshots$ = snapshotLoad$.scan((prev, load) => caseof(load, [
        [K.PromiseStatus.Resolved, load => load.value],
        [null, _.constant(prev)]
      ]), []);

      // Decorate the snapshot list based on the current entry sys
      // information.
      var decoratedSnapshots$ = K.combineProperties(
        [snapshots$, otDoc.sysProperty],
        (snapshots, sys) => snapshotDecorator.withCurrent(sys, snapshots));

      K.onValueScope($scope, decoratedSnapshots$, snapshots => {
        if (snapshots.length > 1 || (snapshots[0] && !snapshots[0].sys.isCurrent)) {
          $scope.snapshots = snapshots;
        } else {
          $scope.snapshots = null;
        }
      });
    }]
  };
}]);
