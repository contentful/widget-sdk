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
      var K = require('utils/kefir');
      var spaceContext = require('spaceContext');
      var snapshotDecorator = require('app/snapshots/helpers/SnapshotDecorator');
      var snapshotStatus = require('app/snapshots/helpers/SnapshotStatus');
      var entityState = require('data/CMA/EntityState').State;

      var PREVIEW_COUNT = 7;

      var entryId = $scope.entityInfo.id;
      var resourceState = $scope.otDoc.resourceState;

      // Listen to publish event and refresh snapshots list
      K.onValueScope($scope, resourceState.stateChange$, function (data) {
        if (data.to === entityState.Published()) {
          load();
        }
      });

      $scope.snapshotStatus = snapshotStatus;

      load();

      function load () {
        var query = {limit: PREVIEW_COUNT};
        $scope.isLoading = true;

        getSnapshots(query)
          .then(function (res) {
            return snapshotDecorator.withCurrent(res.snapshots).then(function (snapshots) {
              res.snapshots = snapshots;
              return res;
            });
          })
          .then(function (res) {
            $scope.hasMore = res.hasMore;
            $scope.snapshots = res.snapshots;
            $scope.hasSnapshots = res.snapshots.length > 1 ||
                (res.snapshots[0] && !res.snapshots[0].sys.isCurrent);
          })
          .catch(function () {
            $scope.errorMessage = 'Failed to load entity snapshots';
          })
          .finally(function () {
            $scope.isLoading = false;
          });
      }

      function getSnapshots (query) {
        // We need to know if there are more items available, but the snapshots
        // endpoint doesn't have a 'total' value.
        // So, to display N items we fetch N+1 to peek into the next page and
        // set hasMore value.
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
    }]
  };
}]);
