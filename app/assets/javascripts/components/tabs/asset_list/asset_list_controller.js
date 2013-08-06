'use strict';

angular.module('contentful').controller('AssetListCtrl', function AssetListCtrl($scope, $q, Paginator, Selection, PromisedLoader, analytics) {
  var assetLoader = new PromisedLoader();

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

  $scope.$watch('searchTerm',  function (term) {
    if (term === null) return;
    $scope.tab.params.list = 'all';
    $scope.paginator.page = 0;
    $scope.resetAssets();
  });

  $scope.switchList = function(list){
    $scope.searchTerm = null;
    var params = $scope.tab.params;
    var shouldReset =
      params.list == list;

    if (shouldReset) {
      this.resetAssets();
    } else {
      this.paginator.page = 0;
      params.list = list;
    }
  };

  $scope.visibleInCurrentList = function(asset){
    switch ($scope.tab.params.list) {
      case 'all':
        return !asset.isDeleted() && !asset.isArchived();
      case 'published':
        return asset.isPublished();
      case 'changed':
        return asset.hasUnpublishedChanges();
      case 'archived':
        return asset.isArchived();
      default:
        return true;
    }
  };

  // TODO doesn't this make some of the resetAssets calls unnecessary?
  $scope.$watch(function pageParameters(scope){
    return {
      page: scope.paginator.page,
      pageLength: scope.paginator.pageLength,
      list: scope.tab.params.list,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetAssets();
  }, true);

  $scope.resetAssets = function() {
    return assetLoader.load($scope.spaceContext.space, 'getAssets', buildQuery()).
    then(function (assets) {
      $scope.paginator.numEntries = assets.total;
      $scope.selection.switchBaseSet(assets.total);
      $scope.assets = assets;
      analytics.track('Reloaded AssetList');
    });
  };

  function buildQuery() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.tab.params.list == 'all') {
      queryObject['sys.archivedAt[exists]'] = 'false';
    } else if ($scope.tab.params.list == 'published') {
      queryObject['sys.publishedAt[exists]'] = 'true';
    } else if ($scope.tab.params.list == 'changed') {
      queryObject['sys.archivedAt[exists]'] = 'false';
      queryObject['changed'] = 'true';
    } else if ($scope.tab.params.list == 'archived') {
      queryObject['sys.archivedAt[exists]'] = 'true';
    }

    if (!_.isEmpty($scope.searchTerm)) {
      queryObject.query = $scope.searchTerm;
    }

    return queryObject;
  }

  $scope.hasQuery = function () {
    var noQuery = $scope.tab.params.list == 'all' && _.isEmpty($scope.searchTerm);
    return !noQuery;
  };

  $scope.loadMore = function() {
    if (this.paginator.atLast()) return;
    $scope.paginator.page++;

    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    assetLoader.load($scope.spaceContext.space, 'getAssets', buildQuery()).
    then(function (assets) {
      $scope.paginator.numEntries = assets.total;
      $scope.selection.switchBaseSet(assets.total);
      $scope.assets.push.apply($scope.assets, assets);
    }, function () {
      $scope.paginator.page--;
    });

    analytics.track('Scrolled AssetList');
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
