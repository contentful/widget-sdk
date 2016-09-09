'use strict';

angular.module('contentful')

.controller('AssetSearchController', ['$scope', 'require', 'getSearchTerm', function AssetSearchController ($scope, require, getSearchTerm) {
  var controller = this;
  var $q = require('$q');
  var Paginator = require('Paginator');
  var PromisedLoader = require('PromisedLoader');
  var ReloadNotification = require('ReloadNotification');
  var analytics = require('analytics');
  var logger = require('logger');
  var spaceContext = require('spaceContext');
  var ListQuery = require('ListQuery');
  var accessChecker = require('accessChecker');

  var assetLoader = new PromisedLoader();

  this.paginator = new Paginator();
  $scope.assetContentType = require('AssetContentType');

  this.resetAssets = function (resetPage) {
    $scope.context.loading = true;
    if (resetPage) { this.paginator.page = 0; }

    return prepareQuery()
    .then(function (query) {
      return assetLoader.loadPromise(function () {
        return spaceContext.space.getAssets(query);
      });
    })
    .then(function (assets) {
      $scope.context.ready = true;
      $scope.context.loading = false;
      controller.paginator.numEntries = assets.total;
      $scope.assets = filterOutDeleted(assets);
      $scope.selection.updateList($scope.assets);
    }, accessChecker.wasForbidden($scope.context))
    .catch(ReloadNotification.apiErrorHandler);
  };

  this.loadMore = function () {
    if (this.paginator.atLast()) return;
    this.paginator.page++;
    var queryForDebug;

    return prepareQuery()
    .then(function (query) {
      analytics.track('Scrolled AssetList');
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
      controller.paginator.numEntries = assets.total;
      assets = _.difference(assets, $scope.assets);
      $scope.assets.push.apply($scope.assets, filterOutDeleted(assets));
      $scope.selection.updateList($scope.assets);
    }, function (err) {
      controller.paginator.page--;
      return $q.reject(err);
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  function filterOutDeleted (assets) {
    return _.filter(assets, function (asset) {
      return !asset.isDeleted();
    });
  }

  function prepareQuery () {
    return ListQuery.getForAssets({
      paginator: controller.paginator,
      searchTerm: getSearchTerm()
    });
  }
}]);
