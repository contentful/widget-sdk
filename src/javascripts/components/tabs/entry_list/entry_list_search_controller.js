'use strict';

angular.module('contentful')

.controller('EntryListSearchController', ['$scope', '$injector', function ($scope, $injector) {
  var ListQuery          = $injector.get('ListQuery');
  var ReloadNotification = $injector.get('ReloadNotification');
  var createRequestQueue = $injector.get('overridingRequestQueue');
  var spaceContext       = $injector.get('spaceContext');
  var accessChecker      = $injector.get('accessChecker');
  var debounce           = $injector.get('debounce');

  var MODE_APPEND  = 'append';
  var MODE_REPLACE = 'replace';
  var MODE_RESET   = 'reset';

  var searchTerm = null;

  var isResettingPage = false;
  var isResettingTerm = false;
  var isAppendingPage = false;

  var debouncedUpdateWithTerm = debounce(updateWithTerm, 500);
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

  $scope.$watch('paginator.page', function () {
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

    // for initial run or resetting term just set search term w/o list update
    if (value === prev.value || isResettingTerm) {
      searchTerm = value;
      isResettingTerm = false;
    }
    // if view was changed or term was cleared then update immediately
    else if (viewChanged || !hasTerm) {
      updateWithTerm(value);
    }
    // use debounced version when user is actively typing
    else if (hasTerm) {
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
      contentTypeId:     getViewItem('contentTypeId'),
      displayedFieldIds: getViewItem('displayedFieldIds'),
      entriesLength:     $scope.entries && $scope.entries.length,
      page:              $scope.paginator.page,
      orderDirection:    getViewItem('order.direction'),
      orderFieldId:      getViewItem('order.fieldId')
    };
  }, refreshEntityCaches, true);

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

  function requestEntries (mode) {
    mode = mode || MODE_RESET;
    $scope.context.loading = true;

    if (mode == MODE_RESET && $scope.paginator.page !== 0) {
      $scope.paginator.page = 0;
      isResettingPage = true;
    }

    return prepareQuery()
    .then(function (query) {
      return spaceContext.space.getEntries(query);
    })
    .then(function (entries) {
      return {
        shouldReset: mode !== MODE_APPEND,
        entries: entries
      };
    });
  }

  function setupEntriesHandler (promise) {
    promise.then(handleEntriesResponse, accessChecker.wasForbidden($scope.context))
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
      $scope.entries  = [];
    }
    // 2. if response doesn't contain any entries:
    if (!res.entries) {
      // reset paginator
      $scope.paginator.numEntries = 0;
    }
    // 3. if response contain some entries:
    else if (Array.isArray(res.entries)) {
      // set paginator's total count
      $scope.paginator.numEntries = res.entries.total;
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
    if ($scope.paginator.atLast() || isAppendingPage || $scope.context.loading) {
      return;
    }

    $scope.$apply(function () {
      isAppendingPage = true;
      $scope.paginator.page += 1;
    });
  }

  function prepareQuery () {
    return ListQuery.getForEntries({
      contentTypeId: getViewItem('contentTypeId'),
      searchTerm:    searchTerm || getViewItem('searchTerm'),
      order:         getViewItem('order'),
      paginator:     $scope.paginator
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
