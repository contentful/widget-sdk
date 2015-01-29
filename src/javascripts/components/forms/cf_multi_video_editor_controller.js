'use strict';

angular.module('contentful').controller('cfMultiVideoEditorController', ['$attrs', '$scope', '$injector', function($attrs, $scope, $injector){
  var ShareJS = $injector.get('ShareJS');
  var $q      = $injector.get('$q');

  var controller                    = this;
  var providerVideoEditorController = $scope.providerVideoEditorController;

  $scope.multiVideoEditor = {
    assets           : [],
    error            : undefined,
    isSortingEnabled : $scope.$eval($attrs.isSortingEnabled),
    searchConfig: {
      isSearchEnabled : $scope.$eval($attrs.isSearchEnabled),
      onSelection     : useSelectedAssets,
      scope           : $scope,
      template        : 'cf_video_search_dialog',
      widgetPlayerDirective : $attrs.widgetPlayerDirective,
      prepareSearch         : providerVideoEditorController.prepareSearch,
      processSearchResults  : providerVideoEditorController.processSearchResults,
      customAttrsForPlayer  : providerVideoEditorController.customAttrsForPlayerInSearchDialog,
      isMultipleSelectionEnabled: true
    },
    widgetPlayerDirective : $attrs.widgetPlayerDirective
  };

  $scope.$watch('fielData.value', function(){
    if (_.isArray($scope.fieldData.value)) {
      $scope.multiVideoEditor.assets = createAssetObjects($scope.fieldData.value);
    }
  });

  this.customAttrsForPlayer = customAttrsForPlayer;
  this.isVideoWidgetReady   = isVideoWidgetReady;
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

  function storeAsset(asset) {
    var assetObject, cb;

    assetObject = initAssetObject(asset.assetId);
    cb          = $q.callbackWithApply();

    if (_.isArray(ShareJS.peek($scope.otDoc, $scope.otPath))) {
      $scope.otDoc.at($scope.otPath).insert(0, asset.assetId, cb);
    } else {
      ShareJS.mkpath({
        doc: $scope.otDoc,
        path: $scope.otPath,
        types: $scope.otPathTypes,
        value: [asset.assetId]
      }, cb);
    }

    cb.promise.then(function () {
      $scope.multiVideoEditor.assets.unshift(assetObject);
      $scope.videoInputController().clearField();
    });
  }

  function removeAsset(index) {
    var cb = $q.callbackWithApply();
    $scope.otDoc.at($scope.otPath.concat(index)).remove(cb);
    cb.promise.then(function () { $scope.multiVideoEditor.assets.splice(index,1); });
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

  function useSelectedAssets(selection) {
    // use controller.storeAsset rather than only
    // storeAsset for testing purposes
    _.each(selection, function(video){ controller.storeAsset({assetId: video.id}); });
  }

  function createAssetObjects(assetIds) {
    return _.map(assetIds, function(assetId){ return initAssetObject(assetId); });
  }

}]);

