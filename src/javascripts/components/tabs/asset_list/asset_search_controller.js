'use strict';
angular.module('contentful').controller('AssetSearchController', ['$scope', '$injector', 'getSearchTerm', function AssetSearchController($scope, $injector, getSearchTerm){
  var controller = this;
  var $q                 = $injector.get('$q');
  var Paginator          = $injector.get('Paginator');
  var PromisedLoader     = $injector.get('PromisedLoader');
  var ReloadNotification = $injector.get('ReloadNotification');
  var analytics          = $injector.get('analytics');
  var searchQueryHelper  = $injector.get('searchQueryHelper');
  var logger             = $injector.get('logger');
  var spaceContext       = $injector.get('spaceContext');
  var ListQuery          = $injector.get('ListQuery');
  var systemFields       = $injector.get('systemFields');
  var accessChecker      = $injector.get('accessChecker');

  var assetLoader = new PromisedLoader();

  this.paginator = new Paginator();
  $scope.assetContentType = searchQueryHelper.assetContentType;

  this.resetAssets = function(resetPage) {
    $scope.context.loading = true;
    if (resetPage) { this.paginator.page = 0; }

    return prepareQuery()
    .then(function (query) {
      return assetLoader.loadPromise(function(){
        return spaceContext.space.getAssets(query);
      });
    })
    .then(function (assets) {
      $scope.context.ready = true;
      $scope.context.loading = false;
      controller.paginator.numEntries = assets.total;
      $scope.assets = assets;
      $scope.selection.updateList(assets);
    }, accessChecker.wasForbidden($scope.context))
    .catch(ReloadNotification.apiErrorHandler);
  };

  this.loadMore = function() {
    if (this.paginator.atLast()) return;
    this.paginator.page++;
    var queryForDebug;

    return prepareQuery()
    .then(function (query) {
      analytics.track('Scrolled AssetList');
      queryForDebug = query;
      return assetLoader.loadPromise(function(){
        return spaceContext.space.getAssets(query);
      });
    })
    .then(function (assets) {
      if(!assets){
        logger.logError('Failed to load more assets', {
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
    }, function (err) {
      controller.paginator.page--;
      return $q.reject(err);
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  function prepareQuery() {
    return ListQuery.getForAssets({
      paginator:  controller.paginator,
      order:      systemFields.getDefaultOrder(),
      searchTerm: getSearchTerm()
    });
  }
}]);
