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
 *   An instance of 'entityEditor/Document'
 * @scope.requires {object} entityInfo
 *   As provided by the entry/asset editor controller
 */
.directive('cfSnapshotSidebarList', ['require', function (require) {
  var templates = require('app/snapshots/SnapshotSidebarListTemplates');

  return {
    restrict: 'E',
    template: templates.snapshotSidebarlist,
    controller: ['require', '$scope', function (require, $scope) {
      var spaceContext = require('spaceContext');
      var snapshotDecorator = require('app/snapshots/helpers/SnapshotDecorator');
      var snapshotStatus = require('app/snapshots/helpers/SnapshotStatus');

      var PREVIEW_COUNT = 7;

      var entryId = $scope.entityInfo.id;
      var resourceState = $scope.otDoc.resourceState;

      // Listen to publish event and refresh snapshots list
      resourceState.stateChange$.onValue(load);

      $scope.snapshotStatus = snapshotStatus;
      $scope.loadMore = loadMore;

      load();

      function load () {
        var query = {limit: PREVIEW_COUNT};
        wrapLoader(
          getSnapshots(query)
          .then(decorateSnapshots(snapshotDecorator.withCurrent))
          .then(function (res) {
            $scope.hasMore = res.hasMore;
            $scope.snapshots = res.snapshots;
            $scope.hasSnapshots = res.snapshots.length > 1 || res.snapshots[0] && !res.snapshots[0].sys.isCurrent;
          }));
      }

      function getSnapshots (query) {
        query.limit += 1;
        return spaceContext.cma.getEntrySnapshots(entryId, query)
          .then(function (snapshots) {
            var hasMore = snapshots.items.length === query.limit;
            if (hasMore) {
              snapshots.items.pop();
            }
            return {
              snapshots: snapshots.items,
              hasMore: hasMore
            };
          });
      }

      function loadMore () {
        if (!$scope.snapshots) {
          return;
        }

        var query = {skip: $scope.snapshots.length, limit: PREVIEW_COUNT};

        wrapLoader(
          getSnapshots(query)
          .then(function (res) {
            $scope.hasMore = res.hasMore;
            Array.prototype.push.apply($scope.snapshots, res.snapshots);
          }));
      }

      function wrapLoader (promise) {
        $scope.isLoading = true;

        return promise
          .catch(function () {
            $scope.errorMessage = 'Failed to load entity snapshots';
          })
          .finally(function () { $scope.isLoading = false; });
      }

      function decorateSnapshots (fn) {
        return function (res) {
          return fn(res.snapshots).then(function (snapshots) {
            res.snapshots = snapshots;
            return res;
          });
        };
      }

    }]
  };
}]);
