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
  var Tracking = require('analytics/events/SearchAndViews');
  var Notification = require('notification');
  var K = require('utils/kefir');
  var Kefir = require('libs/kefir');
  var createSearchInput = require('app/ContentList/Search').default;
  var h = require('ui/Framework').h;

  var assetLoader = new PromisedLoader();

  var setIsSearching = makeIsSearchingSetter(true);
  var unsetIsSearching = makeIsSearchingSetter(false);

  var lastUISearchState = null;

  $scope.context = { ready: false, loading: true };
  // HACK: This makes sure that component bridge renders
  // somethings until search UI is initialized.
  $scope.search = h('div');

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
        return spaceContext.space.getAssets(query);
      })
      .then(function (assets) {
        $scope.context.ready = true;
        controller.paginator.setTotal(assets.total);
        Tracking.searchPerformed($scope.context.view, assets.total);
        $scope.assets = filterOutDeleted(assets);
        $scope.selection.updateList($scope.assets);
        return assets;
      }, function (err) {
        handleAssetsError(err);
        return $q.reject(err);
      })
      .then(unsetIsSearching)
      .catch(ReloadNotification.apiErrorHandler);
  };

  function handleAssetsError (err) {
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
    const nextState = _.cloneDeep(newSearchState);
    delete nextState.contentTypeId; // Assets don't have a content type.
    lastUISearchState = nextState;

    var oldView = _.cloneDeep($scope.context.view);
    var newView = _.extend(oldView, nextState);
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
    lastUISearchState = initialSearchState;
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
      !_.isEmpty(search.searchFilters)
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
