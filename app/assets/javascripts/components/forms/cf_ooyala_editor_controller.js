'use strict';

angular.module('contentful').controller('cfOoyalaEditorController', ['$scope', '$injector', function($scope, $injector){

  var OoyalaErrorMessages = $injector.get('OoyalaErrorMessages');

  $scope.isPlayerReady = false;
  $scope.selectedVideo = {};
  $scope.searchConfig  = {
    onSelection : useSelectedAsset,
    scope       : $scope,
    template    : 'cf_ooyala_search_dialog'
  };

  $scope.handlePlayerReady             = handlePlayerReady;
  $scope.handlePlayerLoadFailure       = handlePlayerLoadFailure;
  $scope.handlePlayerFailedToPlayVideo = handlePlayerFailedToPlayVideo;

  this.addAsset                   = addAsset;
  this.persistInput               = persistInput;
  this.resetEditorInput           = resetEditorInput;
  this.resetErrorsAndCurrentAsset = resetErrorsAndCurrentAsset;
  this.showErrors                 = showErrors;

  function addAsset(asset) {
    $scope.isPlayerReady          = false;
    $scope.selectedVideo.assetId  = asset.assetId;
    $scope.selectedVideo.playerId = asset.playerId;
  }

  function resetErrorsAndCurrentAsset() {
    $scope.errorMessage  = undefined;
    $scope.selectedVideo = {};
  }

  function showErrors(error) {
    $scope.errorMessage = error.message;
  }

  function resetEditorInput() {
    $scope.otChangeValueP(undefined).then(function(){
      resetErrorsAndCurrentAsset();
      $scope.fieldData.value = undefined;
    });
  }

  function useSelectedAsset(selection) {
    $scope.fieldData.value = selection[0].id;
  }

  function persistInput(input) {
    $scope.otChangeValueP(input);
  }

  function handlePlayerReady() {
    /*
     * There's a 'race condition' which makes possible to have an error message
     * and the player at the same time in the UI: if the user types and invalid
     * asset id and fixes that very fast then the first request (for the invalid id)
     * will set the error message and the second one will load the player.
     *
     * To fix that we reset the error message here.
     *
     * */

    $scope.errorMessage  = undefined;
    $scope.isPlayerReady = true;
  }

  function handlePlayerLoadFailure() {
    $scope.errorMessage           = OoyalaErrorMessages.playerFailedToLoad;
    $scope.selectedVideo.playerId = undefined;
  }

  function handlePlayerFailedToPlayVideo() {
    $scope.errorMessage = OoyalaErrorMessages.playerFailedToPlayVideo;
  }
}]);
