'use strict';

angular.module('contentful').controller('cfOoyalaMultiAssetEditorController', ['$scope', '$injector', function($scope, $injector){
  var ShareJS     = $injector.get('ShareJS');
  var $q          = $injector.get('$q');

  $scope.ooyalaMulti = {assets: []};
  $scope.searchConfig  = {
    isMultipleSelectionEnabled: true,
    onSelection : useSelectedAssets,
    scope       : $scope,
    template    : 'cf_ooyala_search_dialog'
  };

  $scope.$watch('fielData.value', function(){
    if (_.isArray($scope.fieldData.value)) {
      $scope.ooyalaMulti.assets = createAssetObjects($scope.fieldData.value);
    }
  });

  this.addAsset         = addAsset;
  this.showErrors       = showErrors;
  this.removeAsset      = removeAsset;
  this.resetErrors      = resetErrors;
  this.resetEditorInput = resetEditorInput;

  function addAsset(asset) {
    var assetObject, cb, promise;

    assetObject = initAssetObject(asset.assetId);

    cb = $q.callbackWithApply();
    if (_.isArray(ShareJS.peek($scope.otDoc, $scope.otPath))) {
      $scope.otDoc.at($scope.otPath).insert(0, asset.assetId, cb);
      promise = cb.promise.then(function () {
        $scope.ooyalaMulti.assets.unshift(assetObject);
        $scope.inputController.clearField();
      });
    } else {
      ShareJS.mkpath({
        doc: $scope.otDoc,
        path: $scope.otPath,
        types: $scope.otPathTypes,
        value: [asset.assetId]
      }, cb);
      promise = cb.promise.then(function () {
        $scope.ooyalaMulti.assets.unshift(assetObject);
        $scope.inputController.clearField();
      });
    }
  }

  function removeAsset(index) {
    var cb = $q.callbackWithApply();
    $scope.otDoc.at($scope.otPath.concat(index)).remove(cb);
    cb.promise.then(function () { $scope.ooyalaMulti.assets.splice(index,1); });
  }

  function resetErrors() {
    $scope.ooyalaMulti.error = undefined;
  }

  function resetEditorInput() {
    $scope.ooyalaMulti.error = undefined;
  }

  function initAssetObject(assetId){
    return {
      assetId: assetId,
      _trackId: _.uniqueId(assetId)
    };
  }

  function showErrors(error){
    $scope.ooyalaMulti.error = error.message;
  }

  function useSelectedAssets(selection) {
    _.each(selection, function(video){ addAsset({assetId: video.id}); });
  }

  function createAssetObjects(assetIds) {
    return _.map(assetIds, function(assetId){ return initAssetObject(assetId); });
  }

}]);
