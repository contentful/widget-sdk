'use strict';

angular.module('contentful')

.controller('EntryListSearchController', ['$scope', 'require', function ($scope, require) {
  var $q = require('$q');
  var ListQuery = require('ListQuery');
  var ReloadNotification = require('ReloadNotification');
  var createRequestQueue = require('overridingRequestQueue');
  var spaceContext = require('spaceContext');
  var accessChecker = require('accessChecker');
  var debounce = require('debounce');

  var AUTOTRIGGER_MIN_LEN = 4;

  var MODE_REPLACE = 'replace';
  var MODE_RESET = 'reset';

  var searchTerm = null;

  var isResettingPage = false;
  var isResettingTerm = false;
  var isReplacingPage = false;

  var setIsSearching = makeIsSearchingSetter(true);
  var unsetIsSearching = makeIsSearchingSetter(false);


  var debouncedUpdateWithTerm = debounce(updateWithTerm, 200);
  var updateEntries = createRequestQueue(requestEntries, setupEntriesHandler);
  var debouncedUpdateEntries = debounce(updateEntries.bind(null, MODE_REPLACE), 3000);

  /**
   * Public API
   */

  $scope.updateEntries = updateEntries;

  this.resetSearchTerm = resetSearchTerm;
  this.hasQuery = hasQuery;

  /**
   * Watches: triggering list updates
   */

  $scope.$watch('paginator.getPage()', function () {
    if (isResettingPage || isReplacingPage) {
      isResettingPage = false;
      isReplacingPage = false;
    } else {
      updateEntries(MODE_REPLACE);
    }
  });

  $scope.$watch('paginator.getTotal()', function (total) {
    if (!$scope.context.loading && !$scope.entries.length && total > 0) {
      debouncedUpdateEntries();
    }
  });

  $scope.$watchCollection(function () {
    return {
      value: getViewItem('searchTerm'),
      view: dotty.get($scope, 'context.view.id')
    };
  }, function (next, prev) {
    var value = next.value;
    var viewChanged = next.view !== prev.view;
    var hasTerm = _.isString(value) && value.length > 0;

    if (value === prev.value || isResettingTerm) {
      // for initial run or resetting term just set search term w/o list update
      searchTerm = value;
      isResettingTerm = false;
    } else if (viewChanged || !hasTerm) {
      // if view was changed or term was cleared then update immediately
      updateWithTerm(value);
    } else if (hasTerm && value.length >= AUTOTRIGGER_MIN_LEN) {
      // use debounced version when user is actively typing
      // we autotrigger only when query is long enough
      debouncedUpdateWithTerm(value);
    }
  });

  $scope.$watch('context.view.contentTypeId', function (value, prev) {
    if (value !== prev) {
      updateEntries();
    }
  });

  $scope.$watch(function () {
    return {
      contentTypeId: getViewItem('contentTypeId'),
      displayedFieldIds: getViewItem('displayedFieldIds'),
      entriesLength: $scope.entries && $scope.entries.length,
      page: $scope.paginator.getPage(),
      orderDirection: getViewItem('order.direction'),
      orderFieldId: getViewItem('order.fieldId')
    };
  }, refreshEntityCaches, true);

  // "forceSearch" event is emitted by the tokenized search directive when:
  // - Enter is pressed and not selecting an autocompletion item
  // - "magnifying glass" icon next to input is clicked
  $scope.$on('forceSearch', function () {
    if (!$scope.context.loading) {
      updateEntries();
    }
  });

  function resetSearchTerm () {
    isResettingTerm = true;
    $scope.context.view.searchTerm = null;
  }

  function hasQuery () {
    return !_.isEmpty(searchTerm) || !_.isEmpty(getViewItem('contentTypeId'));
  }

  function updateWithTerm (term) {
    searchTerm = term;
    updateEntries();
  }

  function makeIsSearchingSetter (flag) {
    return function (res) {
      $scope.context.isSearching = flag;
      return res;
    };
  }

  function requestEntries (mode) {
    var currPage = $scope.paginator.getPage();

    mode = mode || MODE_RESET;
    $scope.context.loading = true;

    // MODE_RESET is to reset page to 0 from whatever page the user is on
    // The page is set to 0 before the call to prepareQuery as that uses
    // paginator.getPage() to build the query to request entries
    if (mode === MODE_RESET && currPage !== 0) {
      $scope.paginator.setPage(0);
      isResettingPage = true;
    }

    // if a user deletes the last entry on page > first page, we should decrement the page by one before
    // refreshing the entries to display. This makes sure that the user doesn't see the
    // no entries advice when he/she deletes the last entry on a page > first page.
    if (mode === MODE_REPLACE && (!$scope.entries || !$scope.entries.length) && currPage > 0) {
      $scope.paginator.setPage(currPage - 1);
      isReplacingPage = true;
    }

    setIsSearching();
    return prepareQuery()
      .then(function (query) {
        return spaceContext.space.getEntries(query);
      })
      .then(unsetIsSearching)
      .catch(function (error) {
        return $q.reject(error);
      });
  }

  function setupEntriesHandler (promise) {
    return promise
      .then(handleEntriesResponse, accessChecker.wasForbidden($scope.context))
      .catch(function (err) {
        if (_.isObject(err) && 'statusCode' in err && err.statusCode === -1) {
          // entries update failed due to some network issue
          setIsSearching();
        }
        return $q.reject(err);
      })
      .catch(ReloadNotification.apiErrorHandler);
  }

  function handleEntriesResponse (entries) {
    // 1. Reset list
    // initialize with an empty array
    $scope.entries = [];

    // 2. if response doesn't contain any entries
    if (!entries) {
      // reset paginator
      $scope.paginator.setTotal(0);
      // 3. if response contain some entries
    } else if (Array.isArray(entries)) {
      // set paginator's total count
      $scope.paginator.setTotal(entries.total);
      // add new entries to the list
      $scope.entries = entries.filter(function (entry) { return !entry.isDeleted(); });
    }
    // 4. always refresh caches
    refreshEntityCaches();
    // 5. update selection with new list
    $scope.selection.updateList($scope.entries);
    // 6. mark view as ready (initialized) and not loading
    $scope.context.ready = true;
    $scope.context.loading = false;
  }

  function prepareQuery () {
    return ListQuery.getForEntries({
      contentTypeId: getViewItem('contentTypeId'),
      searchTerm: getViewItem('searchTerm'),
      order: getViewItem('order'),
      paginator: $scope.paginator
    });
  }

  function refreshEntityCaches () {
    if (getViewItem('contentTypeId')) {
      var fieldIds = getViewItem('displayedFieldIds');
      $scope.entryCache.setDisplayedFieldIds(fieldIds);
      $scope.entryCache.resolveLinkedEntities($scope.entries);
      $scope.assetCache.setDisplayedFieldIds(fieldIds);
      $scope.assetCache.resolveLinkedEntities($scope.entries);
    }
  }

  function getViewItem (path) {
    path = _.isString(path) ? path.split('.') : path;
    return dotty.get($scope, ['context', 'view'].concat(path));
  }
}]);
