'use strict';

angular.module('contentful').
  controller('AssetListCtrl',function AssetListCtrl($scope, $q, Paginator, Selection, PromisedLoader, mimetype, analytics, sentry, searchQueryHelper) {

  var assetLoader = new PromisedLoader();

  $scope.mimetypeGroups = mimetype.groupDisplayNames;

  $scope.assetSection = 'all';

  $scope.paginator = new Paginator();
  $scope.selection = new Selection();

  $scope.$on('entityDeleted', function (event, entity) {
    var scope = event.currentScope;
    var index = _.indexOf(scope.assets, entity);
    if (index > -1) {
      scope.assets.splice(index, 1);
    }
  });

  $scope.$watch(function pageParameters(scope){
    return {
      searchTerm: scope.searchTerm,
      pageLength: scope.paginator.pageLength,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetAssets();
  }, true);

  $scope.visibleInCurrentList = function(){
    // TODO: This needs to basically emulate the API :(
    return true;
  };

  $scope.resetAssets = function() {
    $scope.paginator.page = 0;
    return buildQuery()
    .then(function (query) {
      return assetLoader.load($scope.spaceContext.space, 'getAssets', query);
    })
    .then(function (assets) {
      $scope.paginator.numEntries = assets.total;
      $scope.assets = assets;
      $scope.selection.switchBaseSet($scope.assets.length);
      analytics.track('Reloaded AssetList');
    });
  };

  function buildQuery() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    return searchQueryHelper.buildQuery($scope.spaceContext.space, searchQueryHelper.assetContentType, $scope.searchTerm)
    .then(function (searchQuery) {
      _.extend(queryObject, searchQuery);
      return queryObject;
    });
  }

  $scope.hasQuery = function () {
    return !_.isEmpty($scope.searchTerm);
  };

  $scope.loadMore = function() {
    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    var queryForDebug;
    return buildQuery()
    .then(function (query) {
      analytics.track('Scrolled AssetList');
      queryForDebug = query;
      return assetLoader.load($scope.spaceContext.space, 'getAssets', query);
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
    });
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
});
