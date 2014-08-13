'use strict';
angular.module('contentful').controller('AssetSearchController', ['$scope', '$injector', 'getSearchTerm', function AssetSearchController($scope, $injector, getSearchTerm){
  var controller = this;
  var $q                 = $injector.get('$q');
  var Paginator          = $injector.get('Paginator');
  var PromisedLoader     = $injector.get('PromisedLoader');
  var ReloadNotification = $injector.get('ReloadNotification');
  var analytics          = $injector.get('analytics');
  var searchQueryHelper  = $injector.get('searchQueryHelper');
  var sentry             = $injector.get('sentry');

  var assetLoader = new PromisedLoader();

  this.paginator = new Paginator();
  $scope.assetContentType = searchQueryHelper.assetContentType;
  
  $scope.$on('entityDeleted', function (event, entity) {
    var scope = event.currentScope;
    var index = _.indexOf(scope.assets, entity);
    if (index > -1) {
      scope.assets.splice(index, 1);
    }
  });

  this.resetAssets = function(resetPage) {
    if (resetPage) this.paginator.page = 0;
    return buildQuery()
    .then(function (query) {
      return assetLoader.loadCallback($scope.spaceContext.space, 'getAssets', query);
    })
    .then(function (assets) {
      controller.paginator.numEntries = assets.total;
      $scope.assets = assets;
      $scope.$broadcast('didResetAssets', $scope.assets);
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  this.loadMore = function() {
    if (this.paginator.atLast()) return;
    this.paginator.page++;
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
      controller.paginator.numEntries = assets.total;
      assets = _.difference(assets, $scope.assets);
      $scope.assets.push.apply($scope.assets, assets);
      $scope.$broadcast('didLoadMoreAssets', $scope.assets);
    }, function (err) {
      controller.paginator.page--;
      return $q.reject(err);
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  function buildQuery() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: controller.paginator.pageLength,
      skip:  controller.paginator.skipItems()
    };

    return searchQueryHelper.buildQuery($scope.spaceContext.space,
                                        searchQueryHelper.assetContentType,
                                        getSearchTerm())
    .then(function (searchQuery) {
      _.extend(queryObject, searchQuery);
      return queryObject;
    });
  }

}]);
