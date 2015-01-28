'use strict';

angular.module('contentful').controller('cfOoyalaEditorController', ['$scope', '$injector', function($scope, $injector){
  var controller = this;

  var OoyalaErrorMessages = $injector.get('OoyalaErrorMessages');
  var ooyalaClient        = $injector.get('ooyalaClient');

  ooyalaClient.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  $scope.errorMessage  = undefined;
  $scope.isPlayerReady = false;
  $scope.selectedVideo = {};
  $scope.searchConfig  = {
    onSelection : useSelectedAsset,
    scope       : $scope,
    template    : 'cf_ooyala_search_dialog',
    isSearchEnabled: true
  };

  this.addAsset                   = addAsset;
  this.lookupAsset                = lookupAsset;
  this.persistInput               = persistInput;
  this.resetAsset                 = resetAsset;
  this.resetEditorInput           = resetEditorInput;
  this.resetErrors                = resetErrors;
  this.setPlayerReady             = setPlayerReady;
  this.showFailedToLoadVideoError = showFailedToLoadVideoError;
  this.showFailedToPlayVideoError = showFailedToPlayVideoError;
  this.showErrors                 = showErrors;

  function addAsset(asset) {
    $scope.isPlayerReady          = false;
    $scope.selectedVideo.assetId  = asset.assetId;
    $scope.selectedVideo.playerId = asset.player_id;
  }

  function lookupAsset(assetId) {
    return ooyalaClient.asset(assetId);
  }

  function persistInput(input) {
    $scope.otChangeValue(input);
  }

  function resetAsset() {
    $scope.selectedVideo = {};
  }

  function resetErrors() {
    $scope.errorMessage = undefined;
  }

  function resetEditorInput() {
    $scope.otChangeValue(undefined).then(function(){
      controller.resetErrors();
      controller.resetAsset();
      $scope.fieldData.value = undefined;
    });
  }

  function setPlayerReady() {
    $scope.isPlayerReady = true;
  }

  function showErrors(error) {
    $scope.errorMessage = error.message;
  }

  function showFailedToLoadVideoError() {
    $scope.errorMessage = OoyalaErrorMessages.playerFailedToLoad;
  }

  function showFailedToPlayVideoError() {
    $scope.errorMessage = OoyalaErrorMessages.playerFailedToPlayVideo;
  }

  function useSelectedAsset(selection) {
    $scope.fieldData.value = selection[0].id;
  }
}]);
