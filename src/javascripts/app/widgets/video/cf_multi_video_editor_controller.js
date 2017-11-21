'use strict';

angular.module('contentful')
.controller('cfMultiVideoEditorController',
  ['$scope', 'require', 'widgetApi', function($scope, require, widgetApi) {
  var field = widgetApi.field;
  var providerVideoEditorController = $scope.providerVideoEditorController;


  $scope.multiVideoEditor = {
    assets           : [],
    error            : undefined,
    searchConfig: {
      onSelection     : prependVideos,
      scope           : $scope,
      template        : 'cf_video_search_dialog',
      widgetPlayerDirective : providerVideoEditorController.widgetPlayerDirective,
      prepareSearch         : providerVideoEditorController.prepareSearch,
      processSearchResults  : providerVideoEditorController.processSearchResults,
      customAttrsForPlayer  : providerVideoEditorController.customAttrsForPlayerInSearchDialog,
      isMultipleSelectionEnabled: true
    },
    widgetPlayerDirective : providerVideoEditorController.widgetPlayerDirective
  };

  var offValueChanged = field.onValueChanged(function (videoIds) {
    if (_.isArray(videoIds)) {
      $scope.multiVideoEditor.assets = createAssetObjects(videoIds);
    }
  });

  $scope.$on('$destroy', offValueChanged);

  this.customAttrsForPlayer = customAttrsForPlayer;
  this.isVideoWidgetReady   = isVideoWidgetReady;
  this.isWidgetStatus       = isWidgetStatus;
  this.storeAsset           = storeAsset;
  this.lookupAsset          = lookupAsset;
  this.showErrors           = showErrors;
  this.removeAsset          = removeAsset;
  this.resetErrors          = resetErrors;

  function customAttrsForPlayer(video) {
    return providerVideoEditorController.customAttrsForPlayer(video);
  }

  function isVideoWidgetReady() {
    return providerVideoEditorController.isWidgetReady();
  }

  function isWidgetStatus(value) {
    return providerVideoEditorController.isWidgetStatus(value);
  }

  function storeAsset(asset) {
    field.insertValue(0, asset.assetId)
    .then(function () {
      var assetObject = initAssetObject(asset.assetId);
      $scope.multiVideoEditor.assets.unshift(assetObject);
      $scope.videoInputController().clearField();
    });
  }

  function removeAsset(index) {
    field.removeValueAt(index)
    .then(function () {
      $scope.multiVideoEditor.assets.splice(index, 1);
    });
  }

  function lookupAsset(assetId) {
    return providerVideoEditorController.lookupVideoInProvider(assetId);
  }

  function resetErrors() {
    $scope.multiVideoEditor.error = undefined;
  }

  function initAssetObject(assetId){
    //TODO remove coupling with assetId
    return {
      assetId: assetId,
      _trackId: _.uniqueId(assetId)
    };
  }

  function showErrors(error){
    $scope.multiVideoEditor.error = error.message;
  }

  function prependVideos (videos) {
    var currentAssets = $scope.multiVideoEditor.assets || [];
    var newAssets = _.map(videos, function (video) {
      return initAssetObject(video.id);
    });
    var assets = newAssets.concat(currentAssets) ;
    $scope.multiVideoEditor.assets = assets;
    $scope.videoInputController().clearField();
    field.setValue(_.map(assets, 'assetId'));
  }

  function createAssetObjects(assetIds) {
    return _.map(assetIds, function(assetId){ return initAssetObject(assetId); });
  }

}]);
