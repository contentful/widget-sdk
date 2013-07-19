'use strict';

angular.module('contentful').controller('AssetListCtrl', function AssetListCtrl($scope, Paginator, Selection, cfSpinner, analytics) {
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
    $scope.tab.params.contentTypeId = null;
    $scope.paginator.page = 0;
    $scope.resetAssets();
  });

  $scope.switchList = function(list, contentType){
    $scope.searchTerm = null;
    var params = $scope.tab.params;
    var shouldReset =
      params.list == list &&
      (!contentType || params.contentTypeId == contentType.getId());

    if (shouldReset) {
      this.resetAssets();
    } else {
      this.paginator.page = 0;
      params.contentTypeId = contentType ? contentType.getId() : null;
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
      contentTypeId: scope.tab.params.contentTypeId,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetAssets();
  }, true);

  $scope.resetAssets = function() {
    if (this.reloadInProgress || this.resetPaused) return;
    var scope = this;

    this.reloadInProgress = true;
    var stopSpin = cfSpinner.start();
    this.spaceContext.space.getAssets(this.buildQuery(), function(err, assets, stats) {
      scope.$apply(function(scope){
        scope.reloadInProgress = false;
        if (err) return;
        scope.paginator.numAssets = stats.total;
        scope.selection.switchBaseSet(stats.total);
        scope.assets = assets;
        stopSpin();
      });
    });
    analytics.track('Reloaded AssetList');
  };

  $scope.buildQuery = function() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: this.paginator.pageLength,
      skip: this.paginator.skipItems()
    };

    if (this.tab.params.list == 'all') {
      // do nothing
    } else if (this.tab.params.list == 'published') {
      queryObject['sys.publishedAt[exists]'] = 'true';
    } else if (this.tab.params.list == 'changed') {
      queryObject['sys.archivedAt[exists]'] = 'false';
      queryObject['changed'] = 'true';
    } else if (this.tab.params.list == 'archived') {
      queryObject['sys.archivedAt[exists]'] = 'true';
    } else if (this.tab.params.list == 'contentType') {
      queryObject['sys.contentType.sys.id'] = this.tab.params.contentTypeId;
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
