'use strict';

angular.module('contentful').
  controller('AssetListCtrl',['$scope', '$injector', function AssetListCtrl($scope, $injector) {
  var $controller        = $injector.get('$controller');
  var Paginator          = $injector.get('Paginator');
  var PromisedLoader     = $injector.get('PromisedLoader');
  var ReloadNotification = $injector.get('ReloadNotification');
  var Selection          = $injector.get('Selection');
  var analytics          = $injector.get('analytics');
  var searchQueryHelper  = $injector.get('searchQueryHelper');
  var sentry             = $injector.get('sentry');

  $controller('AssetListViewsController', {$scope: $scope});
  var assetLoader = new PromisedLoader();

  $scope.assetSection = 'all';

  $scope.paginator = new Paginator();
  $scope.selection = new Selection();

  $scope.assetContentType = searchQueryHelper.assetContentType;

  $scope.$on('entityDeleted', function (event, entity) {
    var scope = event.currentScope;
    var index = _.indexOf(scope.assets, entity);
    if (index > -1) {
      scope.assets.splice(index, 1);
    }
  });

  $scope.$watch(function pageParameters(scope){
    return {
      searchTerm: scope.tab.params.view.searchTerm,
      page: scope.paginator.page,
      pageLength: scope.paginator.pageLength,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetAssets(pageParameters.page === old.page);
  }, true);

  $scope.visibleInCurrentList = function(){
    // TODO: This needs to basically emulate the API :(
    return true;
  };

  $scope.resetAssets = function(resetPage) {
    if (resetPage) $scope.paginator.page = 0;
    return buildQuery()
    .then(function (query) {
      return assetLoader.loadCallback($scope.spaceContext.space, 'getAssets', query);
    })
    .then(function (assets) {
      $scope.paginator.numEntries = assets.total;
      $scope.assets = assets;
      $scope.selection.switchBaseSet($scope.assets.length);
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  function buildQuery() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    return searchQueryHelper.buildQuery($scope.spaceContext.space, searchQueryHelper.assetContentType, $scope.tab.params.view.searchTerm)
    .then(function (searchQuery) {
      _.extend(queryObject, searchQuery);
      return queryObject;
    });
  }

  $scope.hasQuery = function () {
    return !_.isEmpty($scope.tab.params.view.searchTerm);
  };

  $scope.loadMore = function() {
    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    var queryForDebug;
    return buildQuery()
    .then(function (query) {
      analytics.track('Scrolled AssetList');
      queryForDebug = query;
      return assetLoader.loadCallback($scope.spaceContext.space, 'getAssets', query);
    })
    .then(function (assets) {
      if(!assets){
        sentry.captureError('Failed to load more assets', {
          data: {
            assets: assets,
            query: queryForDebug
          }
        });
        return;
      }
      $scope.paginator.numEntries = assets.total;
      assets = _.difference(assets, $scope.assets);
      $scope.assets.push.apply($scope.assets, assets);
      $scope.selection.setBaseSize($scope.assets.length);
    }, function () {
      $scope.paginator.page--;
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  $scope.statusClass = function(asset){
    if (asset.isPublished()) {
      if (asset.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return 'published';
      }
    } else if (asset.isArchived()) {
      return 'archived';
    } else {
      return 'draft';
    }
  };

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.resetAssets();
  });
}]);
