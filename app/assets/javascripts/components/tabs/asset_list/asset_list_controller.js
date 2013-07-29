'use strict';

angular.module('contentful').controller('AssetListCtrl', function AssetListCtrl($scope, $q, Paginator, Selection, cfSpinner, analytics) {
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

  $scope.$on('entityArchived', function (ev, asset) {
    var assetId = asset.data.sys.id;
    $scope.resetAssets().then(function () {
      var assets = _.reject($scope.assets, function (asset) {
        return asset.data.sys.id === assetId;
      });
      if($scope.assets.length !== assets.length) {
        $scope.assets = assets;
      }
    });
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
    if (this.reloadInProgress || this.resetPaused) return;
    var scope = this;
    var deferred = $q.defer();

    this.reloadInProgress = true;
    var stopSpin = cfSpinner.start();
    this.spaceContext.space.getAssets(this.buildQuery(), function(err, assets, stats) {
      scope.$apply(function(scope){
        scope.reloadInProgress = false;
        if (err) return deferred.reject();
        scope.paginator.numAssets = stats.total;
        scope.selection.switchBaseSet(stats.total);
        scope.assets = assets;
        deferred.resolve();
        stopSpin();
      });
    });
    analytics.track('Reloaded AssetList');
    return deferred.promise;
  };

  $scope.buildQuery = function() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: this.paginator.pageLength,
      skip: this.paginator.skipItems()
    };

    if (this.tab.params.list == 'all') {
      queryObject['sys.archivedAt[exists]'] = 'false';
    } else if (this.tab.params.list == 'published') {
      queryObject['sys.publishedAt[exists]'] = 'true';
    } else if (this.tab.params.list == 'changed') {
      queryObject['sys.archivedAt[exists]'] = 'false';
      queryObject['changed'] = 'true';
    } else if (this.tab.params.list == 'archived') {
      queryObject['sys.archivedAt[exists]'] = 'true';
    }

    if (!_.isEmpty(this.searchTerm)) {
      queryObject.query = this.searchTerm;
    }

    return queryObject;
  };

  $scope.hasQuery = function () {
    var noQuery = $scope.tab.params.list == 'all' && _.isEmpty($scope.searchTerm);
    return !noQuery;
  };

  $scope.pauseReset = function() {
    if (this.resetPaused) return;
    var scope = this;
    this.resetPaused = true;
    setTimeout(function() {
      scope.resetPaused = false;
    }, 500);
  };

  // TODO unify the behavior between loadMore and resetAssets.
  // Try to get rid of pausereset
  // This is also used in cfAutocompleteResultList
  $scope.loadMore = function() {
    if (this.reloadInProgress || this.resetPaused) return;
    if (this.paginator.atLast()) return;
    var scope = this;
    this.paginator.page++;
    this.pauseReset();
    var stopSpin = cfSpinner.start();
    this.spaceContext.space.getAssets(this.buildQuery(), function(err, assets, stats) {
      scope.reloadInProgress = false;
      if (err) {
        scope.paginator.page--;
        stopSpin();
        return;
      }
      scope.paginator.numAssets = stats.total;
      scope.selection.switchBaseSet(stats.total);
      scope.$apply(function(scope){
        var args = [scope.assets.length, 0].concat(assets);
        scope.assets.splice.apply(scope.assets, args);
        stopSpin();
      });
    });

    scope.$apply(function(scope) {
      scope.reloadInProgress = true;
      analytics.track('Scrolled AssetList');
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
