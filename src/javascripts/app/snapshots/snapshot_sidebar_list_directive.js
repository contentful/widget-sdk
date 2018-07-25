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
  const K = require('utils/kefir');
  const caseof = require('sum-types').caseof;
  const spaceContext = require('spaceContext');
  const snapshotDecorator = require('app/snapshots/helpers/SnapshotDecorator');
  const snapshotStatus = require('app/snapshots/helpers/SnapshotStatus');
  const template = require('app/snapshots/SnapshotSidebarListTemplates').snapshotSidebarlist;

  return {
    restrict: 'E',
    template: template,
    controller: ['$scope', $scope => {
      const PREVIEW_COUNT = 7;

      const entryId = $scope.entityInfo.id;
      const otDoc = $scope.otDoc;

      $scope.snapshotStatus = snapshotStatus;

      const publishedVersion$ = otDoc.sysProperty.map(sys => sys.publishedVersion).skipDuplicates();

      // Promise property containing the request for the first couple
      // of snapshots
      // We re-request snapshots whenever the documents published
      // version changes.
      const snapshotLoad$ = publishedVersion$.flatMapLatest(() => K.promiseProperty(
        spaceContext.cma.getEntrySnapshots(entryId, {limit: PREVIEW_COUNT})
        .then(res => res.items)
      )).toProperty();

      // Property that is true whenever a snapshot request is in
      // progress
      const isLoading$ = snapshotLoad$.map(load => caseof(load, [
        [K.PromiseStatus.Pending, _.constant(true)],
        [null, _.constant(false)]
      ]));

      K.onValueScope($scope, isLoading$, isLoading => {
        $scope.isLoading = isLoading;
      });

      // Property that is true whenever a snapshot request failed
      const hasError$ = snapshotLoad$.map(load => caseof(load, [
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
      const snapshots$ = snapshotLoad$.scan((prev, load) => caseof(load, [
        [K.PromiseStatus.Resolved, load => load.value],
        [null, _.constant(prev)]
      ]), []);

      // Decorate the snapshot list based on the current entry sys
      // information.
      const decoratedSnapshots$ = K.combineProperties(
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
