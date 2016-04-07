'use strict';

angular.module('contentful')
.controller('cfVideoEditorController', ['$scope', 'widgetApi', function($scope, widgetApi){
  var providerVideoEditorController = $scope.providerVideoEditorController;
  var field = widgetApi.field;

  $scope.fieldData = {};
  var detachFieldValueChanged = field.onValueChanged(function (val) {
    $scope.fieldData.value = val;
  });

  $scope.$on('$destroy', detachFieldValueChanged);

  $scope.videoEditor = {
    errorMessage : undefined,
    isPlayerLoading: false,
    isPlayerReady : false,
    selectedAsset : {},
    searchConfig: {
      onSelection : useSelectedAsset,
      scope       : $scope,
      template    : 'cf_video_search_dialog',
      widgetPlayerDirective : providerVideoEditorController.widgetPlayerDirective,
      prepareSearch         : providerVideoEditorController.prepareSearch,
      processSearchResults  : providerVideoEditorController.processSearchResults,
      customAttrsForPlayer  : providerVideoEditorController.customAttrsForPlayerInSearchDialog
    },
    widgetPlayerDirective: providerVideoEditorController.widgetPlayerDirective,
  };

  this.addAsset                        = addAsset;
  this.customAttrsForPlayer            = customAttrsForPlayer;
  this.isVideoWidgetReady              = isVideoWidgetReady;
  this.isWidgetStatus                  = isWidgetStatus;
  this.loadingPlayerFeedbackMessage    = loadingPlayerFeedbackMessage;
  this.lookupAsset                     = lookupAsset;
  this.persistInput                    = persistInput;
  this.resetAsset                      = resetAsset;
  this.resetEditorInput                = resetEditorInput;
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

  function isWidgetStatus(value) {
    return providerVideoEditorController.isWidgetStatus(value);
  }

  function loadingPlayerFeedbackMessage() {
    return providerVideoEditorController.loadingFeedbackMessage($scope.videoEditor.selectedAsset);
  }
  function lookupAsset(assetId) {
    return providerVideoEditorController.lookupVideoInProvider(assetId);
  }

  function persistInput(input) {
    field.setValue(input);
  }

  function resetAsset() {
    $scope.videoEditor.selectedAsset = {};
  }

  function resetEditorInput() {
    field.removeValue();
    $scope.fieldData.value = undefined;
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
