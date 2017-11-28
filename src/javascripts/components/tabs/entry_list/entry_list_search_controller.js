'use strict';

angular.module('contentful')

.controller('EntryListSearchController', ['$scope', 'require', function ($scope, require) {
  var $q = require('$q');
  var ListQuery = require('ListQuery');
  var ReloadNotification = require('ReloadNotification');
  var Notification = require('notification');
  var createRequestQueue = require('overridingRequestQueue');
  var spaceContext = require('spaceContext');
  var accessChecker = require('accessChecker');
  var Tracking = require('analytics/events/SearchAndViews');
  var K = require('utils/kefir');
  var Kefir = require('libs/kefir');
  var createSearchInput = require('app/ContentList/Search').default;
  var h = require('ui/Framework').h;

  var initialized = false;
  var lastUISearchState = null;

  $scope.context = { ready: false, loading: true };
  // HACK: This makes sure that component bridge renders
  // somethings until search UI is initialized.
  $scope.search = h('div');

  // TODO rename this everywhere
  $scope.updateEntries = function () {
    if (isViewLoaded()) {
      resetEntries();
    }
  };

  var updateEntries = createRequestQueue(requestEntries, setupEntriesHandler);

  this.hasQuery = hasQuery;

  // We store the page in a local variable.
  // We need this to determine if a change to 'paginator.getPage()'
  // comes from us or the user.
  var page = 0;
  $scope.$watch(function () {
    return $scope.paginator.getPage();
  }, function (newPage) {
    if (page !== newPage && initialized) {
      page = newPage;
      updateEntries();
    }
  });

  // TODO: Get rid of duplicate code in asset_search_controller.js

  $scope.$watch(function () {
    return {
      viewId: getViewItem('id'),
      search: getViewSearchState()
    };
  }, function () {
    if (!isViewLoaded()) {
      return;
    }
    resetEntries();
  }, true);

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
    initializeSearchUI();
    return updateEntries();
  }

  function requestEntries () {
    initialized = true;
    $scope.context.loading = true;
    $scope.context.isSearching = true;

    return prepareQuery()
      .then(function (query) {
        return spaceContext.space.getEntries(query);
      }, function (err) {
        handleEntriesError(err);
        return $q.reject(err);
      })
      .then(function (result) {
        $scope.context.isSearching = false;
        Tracking.searchPerformed($scope.context.view, result.total);
        return result;
      }, function (err) {
        handleEntriesError(err);
        return $q.reject(err);
      });
  }

  function onSearchChange (newSearchState) {
    lastUISearchState = newSearchState;
    var oldView = _.cloneDeep($scope.context.view);
    var newView = _.extend(oldView, newSearchState);
    $scope.loadView(newView);
  }

  var isSearching$ = K.fromScopeValue($scope, function ($scope) {
    return $scope.context.isSearching;
  });

  function initializeSearchUI () {
    var initialSearchState = getViewSearchState();

    if (_.isEqual(lastUISearchState, initialSearchState)) {
      return;
    }
    lastUISearchState = initialSearchState;
    createSearchInput(
      $scope,
      spaceContext,
      onSearchChange,
      isSearching$,
      initialSearchState,
      Kefir.fromPromise(spaceContext.users.getAll())
    );
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

  function handleEntriesError (err) {
    const isInvalidQuery = isInvalidQueryError(err);
    $scope.context.loading = false;
    $scope.context.isSearching = false;
    $scope.context.ready = true;

    // Reset the view only if the UI was not edited yet.
    if (isInvalidQuery) {
      if (lastUISearchState === null) {
        // invalid search query, let's reset the view...
        $scope.loadView({});
      }
      // ...and let it request assets again after notifing a user
      Notification.error('We detected an invalid search query. Please try again.');
    }
  }

  function isInvalidQueryError (err) {
    return (_.isObject(err) && 'statusCode' in err) && [400, 422].indexOf(err.statusCode) > -1;
  }

  function prepareQuery () {
    return ListQuery.getForEntries(getQueryOptions()).then(function (query) {
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

  function isViewLoaded () {
    return !!_.get($scope, ['context', 'view']);
  }

  function getQueryOptions () {
    return _.extend(getViewSearchState(), {
      order: getViewItem('order'),
      paginator: $scope.paginator
    });
  }

  function hasQuery () {
    var search = getViewSearchState();
    return (
      !_.isEmpty(search.searchText) ||
      !_.isEmpty(search.searchFilters) ||
      !_.isEmpty(search.contentTypeId)
    );
  }

  function getViewSearchState () {
    return {
      searchText: getViewItem('searchText'),
      searchFilters: getViewItem('searchFilters'),
      contentTypeId: getViewItem('contentTypeId')
    };
  }

  function getViewItem (path) {
    path = _.isString(path) ? path.split('.') : path;
    return _.get($scope, ['context', 'view'].concat(path));
  }
}]);
