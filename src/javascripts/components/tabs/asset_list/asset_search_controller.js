'use strict';

angular.module('contentful')

.controller('AssetSearchController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var $q = require('$q');
  var Paginator = require('Paginator');
  var PromisedLoader = require('PromisedLoader');
  var ReloadNotification = require('ReloadNotification');
  var logger = require('logger');
  var spaceContext = require('spaceContext');
  var ListQuery = require('ListQuery');
  var systemFields = require('systemFields');
  var accessChecker = require('accessChecker');
  var Tracking = require('analytics/events/SearchAndViews');
  var Notification = require('notification');
  var K = require('utils/kefir');
  var Kefir = require('libs/kefir');
  var createSearchInput = require('app/ContentList/Search').default;

  var assetLoader = new PromisedLoader();

  var setIsSearching = makeIsSearchingSetter(true);
  var unsetIsSearching = makeIsSearchingSetter(false);

  var lastUISearchState = null;

  $scope.context = { ready: false, loading: true };

  this.hasQuery = hasQuery;

  this.paginator = Paginator.create();
  $scope.assetContentType = require('assetContentType');

  // TODO: Get rid of duplicate code in entry_list_search_controller.js

  $scope.$watch(function () {
    return {
      viewId: getViewItem('id'),
      search: getViewSearchState()
    };
  }, function () {
    if (!isViewLoaded()) {
      return;
    }
    resetAssets();
  }, true);

  function resetAssets () {
    initializeSearchUI();
    return controller.resetAssets(true);
  }

  this.resetAssets = function (resetPage) {
    var currPage = this.paginator.getPage();

    if (resetPage) {
      this.paginator.setPage(0);
    }
    if (!resetPage && !_.get($scope.assets, 'length', 0) && currPage > 0) {
      this.paginator.setPage(currPage - 1);
    }

    return prepareQuery()
      .then(setIsSearching)
      .then(function (query) {
        return assetLoader.loadPromise(function () {
          return spaceContext.space.getAssets(query);
        });
      })
      .then(function (assets) {
        $scope.context.ready = true;
        controller.paginator.setTotal(assets.total);
        Tracking.searchPerformed($scope.context.view, assets.total);
        $scope.assets = filterOutDeleted(assets);
        $scope.selection.updateList($scope.assets);
      }, accessChecker.wasForbidden($scope.context))
      .then(unsetIsSearching)
      .catch(function (err) {
        if (_.isObject(err) && 'statusCode' in err) {
          if (err.statusCode === 400) {
            // invalid search query, let's reset the view...
            $scope.loadView({});
            // ...and let it request assets again after notifing a user
            Notification.error('We detected an invalid search query. Please try again.');
            return;
          } else if (err.statusCode !== -1) {
            // network/API issue, but the query was fine; show the "is searching"
            // screen; it'll be covered by the dialog displayed below
            setIsSearching();
          }
        }

        return ReloadNotification.apiErrorHandler(err);
      });
  };

  this.loadMore = function () {
    if (this.paginator.isAtLast()) {
      return $q.resolve();
    }

    this.paginator.next();
    var queryForDebug;

    return prepareQuery()
      .then(function (query) {
        queryForDebug = query;
        return assetLoader.loadPromise(function () {
          return spaceContext.space.getAssets(query);
        });
      })
      .then(function (assets) {
        if (!assets) {
          logger.logError('Failed to load more assets', {
            data: {
              assets: assets,
              query: queryForDebug
            }
          });
          return;
        }
        controller.paginator.setTotal(assets.total);
        assets = _.difference(assets, $scope.assets);
        $scope.assets.push.apply($scope.assets, filterOutDeleted(assets));
        $scope.selection.updateList($scope.assets);
      }, function (err) {
        controller.paginator.prev();
        return $q.reject(err);
      })
      .catch(ReloadNotification.apiErrorHandler);
  };

  function makeIsSearchingSetter (flag) {
    return function (val) {
      $scope.context.isSearching = flag;
      return val;
    };
  }

  function filterOutDeleted (assets) {
    return _.filter(assets, function (asset) {
      return !asset.isDeleted();
    });
  }

  function onSearchChange (newSearchState) {
    delete newSearchState.contentTypeId; // Assets don't have a content type.
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
    var withAssets = true;

    if (_.isEqual(lastUISearchState, initialSearchState)) {
      return;
    }

    createSearchInput(
      $scope,
      spaceContext,
      onSearchChange,
      isSearching$,
      initialSearchState,
      Kefir.fromPromise(spaceContext.users.getAll()),
      withAssets
    );
  }

  function prepareQuery () {
    return ListQuery.getForAssets(getQueryOptions());
  }

  function getQueryOptions () {
    return _.extend(getViewSearchState(), {
      order: systemFields.getDefaultOrder(),
      paginator: controller.paginator
    });
  }

  function isViewLoaded () {
    return !!_.get($scope, ['context', 'view']);
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
      searchFilters: getViewItem('searchFilters')
    };
  }

  function getViewItem (path) {
    path = _.isString(path) ? path.split('.') : path;
    return _.get($scope, ['context', 'view'].concat(path));
  }
}]);
