'use strict';

angular.module('cf.app')

.directive('cfSnapshotSelector', [function () {
  return {
    template: JST.cf_snapshot_selector(),
    restrict: 'E',
    controller: 'SnapshotSelectorController',
    link: function ($scope, $el) {
      var snapshotListSel = '[aria-label="snapshot-list"]';
      var snapshotListBtnSel = '[aria-label="show-snapshot-list-btn"]';

      var $snapshotSelectorContainer = $el.find(':first-child');
      var $snapshotSelectorToggleBtn = $(snapshotListBtnSel);

      document.addEventListener('click', hideSnapshotList, true);

      $scope.$on('$destroy', function () {
        document.removeEventListener('click', hideSnapshotList, true);
      });

      function hideSnapshotList (e) {
        var $target = $(e.target);
        var keepListOpen = $target.parents(snapshotListBtnSel).length || $target.parents(snapshotListSel).length;

        if ($snapshotSelectorContainer.is(':visible') && !keepListOpen) {
          $snapshotSelectorToggleBtn.click();
        }
      }
    }
  };
}])

.controller('SnapshotSelectorController', ['$scope', 'require', function ($scope, require) {
  var spaceContext = require('spaceContext');
  var moment = require('moment');
  var $q = require('$q');
  var Paginator = require('Paginator');

  var PER_PAGE = 20;

  var snapshotsById = {};

  $scope.isAscending = true;
  $scope.isLoading = false;
  $scope.paginator = Paginator.create(PER_PAGE);
  $scope.loadMore = loadMore;
  $scope.isCurrent = isCurrent;
  $scope.sortByLastEdited = sortByLastEdited;
  $scope.sortByEditor = sortByEditor;
  $scope.sortByStatus = sortByStatus;

  $scope.snapshots = [];
  $scope.paginator.setTotal(0);
  $scope.paginator.setPage(0);

  var removeInitLoadHandler = $scope.$watch('showSnapshotList', lazyLoad);

  function isCurrent (snapshot) {
    return $scope.snapshot.sys.id === snapshot.sys.id;
  }

  function lazyLoad (listVisible) {
    if (listVisible) {
      load();
      removeInitLoadHandler();
    }
  }

  function loadMore () {
    if (!$scope.isLoading && !$scope.paginator.isAtLast()) {
      $scope.paginator.next();
      load();
    }
  }

  function load () {
    var entryId = $scope.entity.getId();
    var query = {
      skip: $scope.paginator.getSkipParam(),
      limit: PER_PAGE + 1
    };

    $scope.isLoading = true;

    return spaceContext.cma.getEntrySnapshots(entryId, query)
    .then(function (res) { return res.items; })
    .then(addUnique)
    .then(decorateWithAuthorName)
    .then(function (snapshots) {
      $scope.snapshots = $scope.snapshots.concat(snapshots);
      $scope.isLoading = false;
    });
  }

  function decorateWithAuthorName (snapshots) {
    var promises = snapshots.map(function (snapshot) {
      return spaceContext.users.get(snapshot.sys.createdBy.sys.id)
        .then(function (user) {
          var authorName = user ? user.getName() : '';

          snapshot.sys.createdBy.authorName = authorName;
          return snapshot;
        });
    });

    return $q.all(promises);
  }

  function addUnique (snapshots) {
    $scope.paginator.setTotal(function (total) {
      return total + snapshots.length;
    });

    return snapshots.slice(0, PER_PAGE).filter(function (snapshot) {
      return !snapshotsById[snapshot.sys.id];
    }).reduce(function (acc, snapshot) {
      snapshotsById[snapshot.sys.id] = snapshot;
      acc.push(snapshot);
      return acc;
    }, []);
  }

  function resetSortFlags () {
    $scope.sortOrder = {
      byLastEdited: false,
      byEditor: false,
      byStatus: false
    };
  }

  function sortByLastEdited (isAscending) {
    resetSortFlags();
    $scope.sortOrder.byLastEdited = true;
    sortByDate(isAscending);
  }

  function sortByEditor (isAscending) {
    resetSortFlags();
    $scope.sortOrder.byEditor = true;
    sortAsStringAtPath('sys.createdBy.authorName', isAscending);
  }

  function sortByStatus (isAscending) {
    resetSortFlags();
    $scope.sortOrder.byStatus = true;
    sortAsStringAtPath('sys.snapshotType', isAscending);
  }

  /**
   * The functions below mutate $scope.snapshots
   * as they use Array.prototype.sort and
   * Array.prototype.reverse both of which mutate
   * the array they are called on.
   */
  function handleOrdering (snapshots, isAscending) {
    if (!isAscending) {
      _.reverse(snapshots);
    }
    $scope.isAscending = !isAscending;
  }

  function sortByDate (isAscending) {
    $scope.snapshots.sort(function (a, b) {
      return moment(a.sys.createdAt).unix() - moment(b.sys.createdAt).unix();
    });
    handleOrdering($scope.snapshots, isAscending);
  }

  function sortAsStringAtPath (stringPropertyPath, isAscending) {
    $scope.snapshots.sort(function (a, b) {
      a = dotty.get(a, stringPropertyPath, '');
      b = dotty.get(b, stringPropertyPath, '');

      if (a === b) {
        return 0;
      } else {
        return a < b ? -1 : 1;
      }
    });
    handleOrdering($scope.snapshots, isAscending);
  }
}]);
