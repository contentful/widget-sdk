'use strict';

angular.module('contentful')

.controller('EntryListSearchController', ['$scope', '$injector', function ($scope, $injector) {
  var ListQuery          = $injector.get('ListQuery');
  var ReloadNotification = $injector.get('ReloadNotification');
  var createRequestQueue = $injector.get('overridingRequestQueue');
  var spaceContext       = $injector.get('spaceContext');
  var accessChecker      = $injector.get('accessChecker');
  var debounce           = $injector.get('debounce');

  var searchTerm = null;
  var isResettingPage = false;
  var isResettingTerm = false;

  var debouncedUpdateWithTerm = debounce(updateWithTerm, 300);
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

  $scope.$watch('paginator.page', function pageChanged () {
    if (isResettingPage) {
      isResettingPage = false;
      return;
    }

    updateEntries(false);
  });

  $scope.$watch('context.view.searchTerm', function termChanged (value, prev) {
    if (value === prev || isResettingTerm) {
      searchTerm = value;
      isResettingTerm = false;
      return;
    }

    if (_.isString(value) && value.length > 0) {
      // use debounced version when user is actively typing
      debouncedUpdateWithTerm(value);
    } else {
      updateWithTerm(value);
    }
  });

  $scope.$watch('context.view.contentTypeId', function ctIdChanged (value, prev) {
    if (value !== prev) {
      updateEntries(true);
    }
  });

  $scope.$watch(function getCacheParameters (scope) {
    return {
      contentTypeId:     getViewItem('contentTypeId'),
      displayedFieldIds: getViewItem('displayedFieldIds'),
      entriesLength:     scope.entries && scope.entries.length,
      page:              scope.paginator.page,
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
    updateEntries(true);
  }

  function requestEntries (shouldReset) {
    $scope.context.loading = true;
    if (shouldReset && $scope.paginator.page !== 0) {
      $scope.paginator.page = 0;
      isResettingPage = true;
    }

    return prepareQuery()
    .then(function (query) {
      return spaceContext.space.getEntries(query);
    })
    .then(function (entries) {
      return {shouldReset: shouldReset, entries: entries};
    });
  }

  function setupEntriesHandler (promise) {
    promise.then(handleEntriesResponse, accessChecker.wasForbidden($scope.context))
    .catch(ReloadNotification.apiErrorHandler);
  }

  function handleEntriesResponse (res) {
    // 1. if list should be reset or entries list is not initialized:
    if (res.shouldReset || !$scope.entries) {
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
      var entriesToAdd = _.difference(res.entries, $scope.entries);
      $scope.entries.push.apply($scope.entries, entriesToAdd);
    }
    // 4. always refresh caches
    refreshEntityCaches();
    // 5. mark view as ready (initialized) and not loading
    $scope.context.ready = true;
    $scope.context.loading = false;
  }

  function loadNextPage () {
    if (!$scope.paginator.atLast()) {
      $scope.$apply(function () {
        $scope.paginator.page += 1;
      });
    }
  }

  function prepareQuery () {
    return ListQuery.getForEntries({
      contentTypeId: getViewItem('contentTypeId'),
      searchTerm:    searchTerm,
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
