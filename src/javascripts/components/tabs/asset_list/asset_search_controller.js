'use strict';

angular.module('contentful')

.controller('AssetSearchController', ['$scope', 'require', 'getSearchTerm', function AssetSearchController ($scope, require, getSearchTerm) {
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

  var assetLoader = new PromisedLoader();

  var setIsSearching = makeIsSearchingSetter(true);
  var unsetIsSearching = makeIsSearchingSetter(false);

  this.paginator = Paginator.create();
  $scope.assetContentType = require('assetContentType');

  this.resetAssets = function (resetPage) {
    var currPage = this.paginator.getPage();

    if (resetPage) { this.paginator.setPage(0); }
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
            // network/API issue, but the query was fine; show the "is serching"
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

  function prepareQuery () {
    return ListQuery.getForAssets({
      paginator: controller.paginator,
      order: systemFields.getDefaultOrder(),
      searchTerm: getSearchTerm()
    });
  }
}]);
