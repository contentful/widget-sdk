'use strict';

angular.module('contentful').controller('AssetListActionsCtrl', function AssetListActionsCtrl($scope, notification, analytics) {

  var _cacheSelected;

  // At the beginning of every digest cycle destroy the cache of selected assets
  $scope.$watch(function () { _cacheSelected = null; });

  var getSelected = function () {
    // Memoize result of getSelected call for duration of cycle
    if (_cacheSelected === null || _cacheSelected === undefined) {
      _cacheSelected = $scope.selection.getSelected($scope.assets);
    }
    return _cacheSelected;
  };

  var clearSelection = function () {
    $scope.selection.removeAll();
    _cacheSelected = null;
  };

  var every = function (predicate) {
    return _.every(getSelected(), function (asset) {
      return asset[predicate]();
    });
  };

  var forAllAssets = function(callback) {
    var assets = getSelected();
    _.each(assets, callback);
  };

  var makeApplyLater = function(callback) {
    var num = $scope.selection.size();
    var numCalled = 0;
    var results = [];
    return function(err) {
      numCalled++;
      results.push({
        err: err,
        rest: Array.prototype.slice.call(arguments, 1)
      });
      if (numCalled === num)
        $scope.$apply(_.partial(callback, results));
    };
  };

  function makeBatchResultsNotifier(word) {
    return function(results) {
      var hasFailed = function(r) { return r.err; };
      var failed = _.filter(results, hasFailed);
      var succeeded = _.reject(results, hasFailed);
      if (succeeded.length > 0)
        notification.info(succeeded.length + ' assets ' + word + ' successfully');
      if (failed.length > 0)
        notification.error(failed.length + ' assets could not be ' + word);
    };
  }

  var perform = function(params) {
    var applyLater = makeApplyLater(params.callback);
    forAllAssets(function(asset) {
      asset[params.method](function(err, asset){
        if(!err && params.event) $scope.broadcastFromSpace(params.event, asset);
        applyLater();
      });
    });
    clearSelection();
    analytics.track('Performed AssetList action', {action: params.method});
  };

  $scope.publishSelected = function() {
    var applyLater = makeApplyLater(makeBatchResultsNotifier('published'));
    forAllAssets(function(asset) {
      asset.publish(asset.data.sys.version, applyLater);
    });
    clearSelection();
    analytics.track('Performed AssetList action', {action: 'publish'});
  };

  $scope.unpublishSelected = function() {
    perform({
      method: 'unpublish',
      callback: makeBatchResultsNotifier('unpublished')
    });
  };

  $scope.deleteSelected = function() {
    perform({
      method: 'delete',
      callback: makeBatchResultsNotifier('deleted'),
      event: 'entityDeleted'
    });
  };

  $scope.archiveSelected = function() {
    perform({
      method: 'archive',
      callback: makeBatchResultsNotifier('archived'),
      event: 'entityArchived'
    });
  };

  $scope.unarchiveSelected = function() {
    perform({
      method: 'unarchive',
      callback: makeBatchResultsNotifier('unarchived')
    });
  };

  $scope.showDelete = function () {
    return every('canDelete');
  };

  $scope.showArchive = function () {
    return every('canArchive');
  };

  $scope.showUnarchive = function () {
    return every('canUnarchive');
  };

  $scope.showUnpublish = function () {
    return every('canUnpublish');
  };

  $scope.showPublish = function () {
    return every('canPublish');
  };

  $scope.publishButtonName = function () {
    var published = 0;
    var unpublished = 0;
    _.each(getSelected(), function (asset) {
      if (asset.isPublished()) {
        published++;
      } else {
        unpublished++;
      }
    });
    if (  published === 0) return 'Publish';
    if (unpublished === 0) return 'Republish';
    return '(Re)publish';
  };
});
