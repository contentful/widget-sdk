'use strict';

angular.module('cf.app')

.directive('cfSnapshotSelector', [() => ({
  template: JST.cf_snapshot_selector(),
  restrict: 'E',
  controller: 'SnapshotSelectorController',

  link: function ($scope, $el) {
    var snapshotListSel = '[aria-label="snapshot-list"]';
    var snapshotListBtnSel = '[aria-label="show-snapshot-list-btn"]';

    var $snapshotSelectorContainer = $el.find(':first-child');
    var $snapshotSelectorToggleBtn = $(snapshotListBtnSel);

    document.addEventListener('click', hideSnapshotList, true);

    $scope.$on('$destroy', () => {
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
})])

.controller('SnapshotSelectorController', ['$scope', 'require', ($scope, require) => {
  var K = require('utils/kefir');
  var spaceContext = require('spaceContext');
  var moment = require('moment');
  var Paginator = require('Paginator');
  var snapshotStatus = require('app/snapshots/helpers/SnapshotStatus');
  var snapshotDecorator = require('app/snapshots/helpers/SnapshotDecorator');

  var PER_PAGE = 20;

  var otDoc = $scope.otDoc;
  var entryId = $scope.entityInfo.id;
  var snapshotsById = {};

  $scope.isAscending = true;
  $scope.isLoading = false;
  $scope.paginator = Paginator.create(PER_PAGE);
  $scope.loadMore = loadMore;
  $scope.isActive = isActive;
  $scope.sortByLastEdited = sortByLastEdited;
  $scope.sortByEditor = sortByEditor;
  $scope.sortByStatus = sortByStatus;
  $scope.snapshotStatus = snapshotStatus;

  $scope.snapshots = [];
  $scope.paginator.setTotal(0);
  $scope.paginator.setPage(0);


  var snapshotsFirstShown$ = $scope.showSnapshotSelector$
      .filter(val => val)
      .take(1);

  K.onValueScope($scope, snapshotsFirstShown$, load);

  var entrySys = K.getValue(otDoc.sysProperty);

  function isActive (snapshot) {
    return $scope.snapshot.sys.id === snapshot.sys.id;
  }

  function loadMore () {
    if (!$scope.isLoading && !$scope.paginator.isAtLast()) {
      $scope.paginator.next();
      load();
    }
  }

  function load () {
    var query = {
      skip: $scope.paginator.getSkipParam(),
      limit: PER_PAGE + 1
    };

    $scope.isLoading = true;

    return spaceContext.cma.getEntrySnapshots(entryId, query)
    .then(res => res.items)
    .then(addUnique)
    .then(snapshots => snapshotDecorator.withCurrent(entrySys, snapshots))
    .then(snapshots => snapshotDecorator.withAuthorName(spaceContext, snapshots))
    .then(snapshots => {
      $scope.snapshots = $scope.snapshots.concat(snapshots);
      $scope.isLoading = false;
    });
  }

  function addUnique (snapshots) {
    $scope.paginator.setTotal(total => total + snapshots.length);

    return snapshots.slice(0, PER_PAGE).filter(snapshot => !snapshotsById[snapshot.sys.id]).reduce((acc, snapshot) => {
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
    $scope.snapshots.sort((a, b) => moment(a.sys.createdAt).unix() - moment(b.sys.createdAt).unix());
    handleOrdering($scope.snapshots, isAscending);
  }

  function sortAsStringAtPath (stringPropertyPath, isAscending) {
    $scope.snapshots.sort((a, b) => {
      a = _.get(a, stringPropertyPath, '');
      b = _.get(b, stringPropertyPath, '');

      if (a === b) {
        return 0;
      } else {
        return a < b ? -1 : 1;
      }
    });
    handleOrdering($scope.snapshots, isAscending);
  }
}]);
