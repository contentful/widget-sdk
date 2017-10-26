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
  var K = require('utils/kefir');
  var createSearchInput = require('app/ContentList/Search').default;
  var makeCMAQueryObject = require('app/ContentList/Search/Filters').makeCMAQueryObject;

  $scope.context = { ready: false, loading: true };

  var AUTOTRIGGER_MIN_LEN = 4;

  var searchTerm = null;

  var isResettingTerm = false;
  var currentQuery;

  var debouncedUpdateWithTerm = debounce(updateWithTerm, 200);

  /**
   * Public API
   */

  // TODO rename this everywhere
  $scope.updateEntries = resetEntries;

  var updateEntries = createRequestQueue(requestEntries, setupEntriesHandler);

  this.resetSearchTerm = resetSearchTerm;
  this.hasQuery = hasQuery;

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
      view: getViewItem('id')
    };
  }, function (next, prev) {
    var value = next.value;
    var viewChanged = next.view !== prev.view;
    var hasTerm = _.isString(value) && value.length > 0;

    // if view was changed updated immediately
    if (viewChanged) {
      updateWithTerm(value);
      return;
    }

    // for initial run or resetting term just set search term w/o list update
    if (value === prev.value || isResettingTerm) {
      searchTerm = value;
      isResettingTerm = false;
      return;
    }

    // if term was cleared then update immediately
    if (!hasTerm) {
      updateWithTerm(value);
      return;
    }

    // use debounced version when user is actively typing
    // we autotrigger only when query is long enough
    if (hasTerm && value.length >= AUTOTRIGGER_MIN_LEN) {
      debouncedUpdateWithTerm(value);
      return;
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
      getViewItem('collection') ||
      currentQuery
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

  var triggerSearch = createRequestQueue(triggerSearch_, setupEntriesHandler);
  function triggerSearch_ (searchState) {
    if (!searchState) {
      currentQuery = null;
      return;
    }
    var query = makeCMAQueryObject(searchState);
    currentQuery = query;

    console.log('QUERY', query, searchState);

    var oldView = _.cloneDeep($scope.context.view);
    var newView = _.extend(oldView, searchState);
    $scope.loadView(newView);

    // TODO support ordering
    query = _.assign({}, query, {
      limit: $scope.paginator.getPerPage(),
      skip: $scope.paginator.getSkipParam()
    });
    $scope.context.loading = true;
    $scope.context.isSearching = true;
    return spaceContext.space.getEntries(query)
     .then(function (result) {
       $scope.context.isSearching = false;
       Tracking.searchPerformed($scope.context.view, result.total);
       return result;
     })
     .catch(function (error) {
       return $q.reject(error);
     });
  }

  var isSearching$ = K.fromScopeValue($scope, function ($scope) {
    return $scope.context.isSearching;
  });

  // TODO:danwe Remove this ugly hack for testing the ui with url view data.
  setTimeout(function () {
    var initialSearchState = _.pick($scope.context.view,
      ['contentTypeId', 'searchText', 'searchFilters']);
    createSearchInput(
      $scope, spaceContext, triggerSearch, isSearching$, initialSearchState);
  }, 1000);

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
    return ListQuery.getForEntries({
      contentTypeId: getViewItem('contentTypeId'),
      searchTerm: getViewItem('searchTerm'),
      order: getViewItem('order'),
      paginator: $scope.paginator
    }).then(function (query) {
      var collection = getViewItem('collection');
      if (collection && Array.isArray(collection.items)) {
        query['sys.id[in]'] = collection.items.join(',');
      }
      return query;
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
    return _.get($scope, ['context', 'view'].concat(path));
  }
}]);
