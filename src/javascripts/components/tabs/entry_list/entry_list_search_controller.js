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
  var Tracking = require('analytics/events/SearchAndViews');

  var AUTOTRIGGER_MIN_LEN = 4;

  var searchTerm = null;

  var isResettingTerm = false;

  var debouncedUpdateWithTerm = debounce(updateWithTerm, 200);

  /**
   * Public API
   */

  // TODO rename this everywhere
  $scope.updateEntries = resetEntries;

  var updateEntries = createRequestQueue(requestEntries, setupEntriesHandler);

  this.resetSearchTerm = resetSearchTerm;
  this.hasQuery = hasQuery;

  $scope.hasNoSearchResults = function () {
    return hasQuery() && !$scope.paginator.getTotal() && !$scope.context.loading && !$scope.context.view.collection;
  };

  $scope.emptyCollection = function () {
    return !$scope.paginator.getTotal() && $scope.context.view.collection;
  };

  /**
   * Watches: triggering list updates
   */

  // We store the page in a local variable.
  // We need this to determine if a change to 'paginator.getPage()'
  // comes from us or the user or from us.
  var page = null;
  $scope.$watch(function () {
    return $scope.paginator.getPage();
  }, function (newPage) {
    if (page !== newPage) {
      page = newPage;
      updateEntries();
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
      resetEntries();
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
      resetEntries();
    }
  });

  function resetSearchTerm () {
    isResettingTerm = true;
    $scope.context.view.searchTerm = null;
  }

  function hasQuery () {
    return (
      !_.isEmpty(searchTerm) ||
      !_.isEmpty(getViewItem('contentTypeId')) ||
      getViewItem('collection')
    );
  }

  function updateWithTerm (term) {
    searchTerm = term;
    resetEntries();
  }

  // When the user deletes an entry it is removed from the entries
  // list. If that list becomes empty we want to go to the previous
  // page.
  $scope.$watch('entries.length', function (entriesLength) {
    var currPage = $scope.paginator.getPage();
    if (!entriesLength && !$scope.context.loading && $scope.paginator.getPage() > 0) {
      $scope.paginator.setPage(currPage - 1);
    }
  });

  function resetEntries () {
    $scope.paginator.setPage(0);
    page = 0;
    return updateEntries();
  }

  function requestEntries () {
    $scope.context.loading = true;
    $scope.context.isSearching = true;
    return prepareQuery()
      .then(function (query) {
        return spaceContext.space.getEntries(query);
      })
     .then(function (result) {
       $scope.context.isSearching = false;
       Tracking.searchPerformed($scope.context.view, result.total);
       return result;
     })
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
          $scope.context.isSearching = true;
        }
        return $q.reject(err);
      })
      .catch(ReloadNotification.apiErrorHandler);
  }

  function handleEntriesResponse (entries) {
    $scope.entries = [];

    if (!entries) {
      $scope.paginator.setTotal(0);
    } else if (Array.isArray(entries)) {
      $scope.paginator.setTotal(entries.total);

      if ($scope.paginator.isBeyondLast()) {
        var lastPage = $scope.paginator.getPageCount() - 1;
        $scope.setPage(lastPage);
      }

      $scope.entries = entries.filter(function (entry) { return !entry.isDeleted(); });
    }
    refreshEntityCaches();
    $scope.selection.updateList($scope.entries);
    $scope.context.ready = true;
    $scope.context.loading = false;
  }

  function prepareQuery () {
    var collection = getViewItem('collection');
    if (collection) {
      return ListQuery.getForEntryCollection(
        collection.items,
        getViewItem('order'),
        $scope.paginator
      );
    } else {
      return ListQuery.getForEntries({
        contentTypeId: getViewItem('contentTypeId'),
        searchTerm: getViewItem('searchTerm'),
        order: getViewItem('order'),
        paginator: $scope.paginator
      });
    }
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
