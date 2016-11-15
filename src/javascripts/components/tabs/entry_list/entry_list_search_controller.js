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

  var MODE_APPEND = 'append';
  var MODE_REPLACE = 'replace';
  var MODE_RESET = 'reset';

  var searchTerm = null;

  var isResettingPage = false;
  var isResettingTerm = false;
  var isAppendingPage = false;

  var setIsSearching = makeIsSearchingSetter(true);
  var unsetIsSearching = makeIsSearchingSetter(false);


  var debouncedUpdateWithTerm = debounce(updateWithTerm, 200);
  var updateEntries = createRequestQueue(requestEntries, setupEntriesHandler);

  /**
   * Public API
   */

  $scope.updateEntries = updateEntries;
  $scope.loadNextPage = loadNextPage;

  this.resetSearchTerm = resetSearchTerm;
  this.hasQuery = hasQuery;

  /**
   * Watches: triggering list updates
   */

  $scope.$watch('paginator.getPage()', function () {
    if (isResettingPage) {
      isResettingPage = false;
    } else {
      updateEntries(isAppendingPage ? MODE_APPEND : MODE_REPLACE);
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
    mode = mode || MODE_RESET;
    $scope.context.loading = true;
    if (mode === MODE_RESET && $scope.paginator.getPage() !== 0) {
      $scope.paginator.setPage(0);
      isResettingPage = true;
    }

    return prepareQuery()
      .then(setIsSearching)
      .then(function (query) {
        return spaceContext.space.getEntries(query);
      })
      .then(function (entries) {
        return {
          shouldReset: mode !== MODE_APPEND,
          entries: entries
        };
      })
      .catch(function (error) {
        return $q.reject(error);
      });
  }

  function setupEntriesHandler (promise) {
    return promise
      .then(unsetIsSearching)
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

  function handleEntriesResponse (res) {
    // 1. if list should be reset or entries list is not initialized:
    if (res.shouldReset || !$scope.entries) {
      // @todo DOM hack: scroll endless container to top
      var container = $('[cf-endless-container]').first().get(0);
      if (container) {
        container.scrollTop = 0;
      }
      // initialize with an empty array
      $scope.entries = [];
    }
    // 2. if response doesn't contain any entries:
    if (!res.entries) {
      // reset paginator
      $scope.paginator.setTotal(0);
    } else if (Array.isArray(res.entries)) { // 3. if response contain some entries:
      // set paginator's total count
      $scope.paginator.setTotal(res.entries.total);
      // add new entries to the list
      var entriesToAdd = _(res.entries)
      .difference($scope.entries)
      .filter(function (entry) { return !entry.isDeleted(); })
      .value();
      $scope.entries.push.apply($scope.entries, entriesToAdd);
    }
    // 4. always refresh caches
    refreshEntityCaches();
    // 5. update selection with new list
    $scope.selection.updateList($scope.entries);
    // 6. mark view as ready (initialized) and not loading
    $scope.context.ready = true;
    $scope.context.loading = false;
    isAppendingPage = false;
  }

  function loadNextPage () {
    if ($scope.paginator.isAtLast() || isAppendingPage || $scope.context.loading) {
      return;
    }

    $scope.$apply(function () {
      isAppendingPage = true;
      $scope.paginator.next();
    });
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
