'use strict';

angular.module('contentful').controller('cfVideoEditorController', ['$scope', '$attrs', function($scope, $attrs){
  var providerVideoEditorController = $scope.providerVideoEditorController;

  $scope.videoEditor = {
    errorMessage : undefined,
    isPlayerLoading: false,
    isPlayerReady : false,
    selectedAsset : {},
    searchConfig: {
      isSearchEnabled : $scope.$eval($attrs.isSearchEnabled),
      onSelection : useSelectedAsset,
      scope       : $scope,
      template    : 'cf_video_search_dialog',
      widgetPlayerDirective : $attrs.widgetPlayerDirective,
      prepareSearch         : providerVideoEditorController.prepareSearch,
      processSearchResults  : providerVideoEditorController.processSearchResults,
      customAttrsForPlayer  : providerVideoEditorController.customAttrsForPlayerInSearchDialog
    },
    widgetPlayerDirective : $attrs.widgetPlayerDirective
  };

  this.addAsset                        = addAsset;
  this.customAttrsForPlayer            = customAttrsForPlayer;
  this.isVideoWidgetReady              = isVideoWidgetReady;
  this.loadingPlayerFeedbackMessage    = loadingPlayerFeedbackMessage;
  this.lookupAsset                     = lookupAsset;
  this.persistInput                    = persistInput;
  this.resetAsset                      = resetAsset;
  this.resetErrors                     = resetErrors;
  this.setPlayerIsNotLoading           = setPlayerIsNotLoading;
  this.setPlayerIsLoading              = setPlayerIsLoading;
  this.setPlayerNotReady               = setPlayerNotReady;
  this.setPlayerReady                  = setPlayerReady;
  this.showErrors                      = showErrors;
  this.shouldShowPlayerLoadingFeedback = shouldShowPlayerLoadingFeedback;
  this.shouldRenderVideoPlayer         = shouldRenderVideoPlayer;

  function addAsset(asset) {
    $scope.videoEditor.selectedAsset = providerVideoEditorController.processLookupInProviderResult(asset);
  }

  function customAttrsForPlayer() {
    return providerVideoEditorController.customAttrsForPlayer($scope.videoEditor.selectedAsset);
  }

  function isVideoWidgetReady() {
    return providerVideoEditorController.isWidgetReady();
  }

  function loadingPlayerFeedbackMessage() {
    return providerVideoEditorController.loadingFeedbackMessage($scope.videoEditor.selectedAsset);
  }
  function lookupAsset(assetId) {
    return providerVideoEditorController.lookupVideoInProvider(assetId);
  }

  function persistInput(input) {
    $scope.otChangeValue(input);
  }

  function resetAsset() {
    $scope.videoEditor.selectedAsset = {};
  }

  function resetErrors() {
    $scope.videoEditor.errorMessage = undefined;
  }

  function setPlayerIsLoading() {
    $scope.videoEditor.isPlayerLoading = true;
  }

  function setPlayerIsNotLoading() {
    $scope.videoEditor.isPlayerLoading = false;
  }

  function setPlayerNotReady() {
    $scope.videoEditor.isPlayerReady = false;
  }

  function setPlayerReady() {
    $scope.videoEditor.isPlayerReady = true;
  }

  function showErrors(error) {
    $scope.videoEditor.errorMessage = error.message;
  }

  function shouldShowPlayerLoadingFeedback() {
    return $scope.videoEditor.isPlayerLoading && !$scope.videoEditor.isPlayerReady && !$scope.videoEditor.errorMessage;
  }

  function shouldRenderVideoPlayer() {
    return providerVideoEditorController.shouldRenderVideoPlayer($scope.videoEditor.selectedAsset);
  }

  function useSelectedAsset(selection) {
    if (selection.length == 1)
      $scope.fieldData.value = selection[0].id;
  }
}]);
