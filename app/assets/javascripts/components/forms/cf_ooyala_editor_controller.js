'use strict';

angular.module('contentful').controller('cfOoyalaEditorController', ['$scope', '$injector', function($scope, $injector){

  var ooyalaClient = $injector.get('ooyalaClient');
  var debounce     = $injector.get('debounce');

  var errorMessages = {
    invalidAssetID     : 'Can not load the video. Please check the content id',
    playerFailedToLoad : 'Can not load the player. Please reload the page',
    playerFailedToPlayVideo : 'Can not play the video. Please reload the page'
  };

  var debouncedFetchAssetInfoFromOoyala = debounce(fetchAssetInfoFromOoyala, 750);

  $scope.$watch('assetId', watchAssetId);

  $scope.isLoading = false;
  $scope.playerReady = false;

  $scope.handleClickOnRemoveSign = handleClickOnRemoveSign;
  $scope.handlePlayerReady       = handlePlayerReady;
  $scope.handlePlayerLoadFailure = handlePlayerLoadFailure;
  $scope.handlePlayerFailedToPlayVideo = handlePlayerFailedToPlayVideo;


  function watchAssetId(assetId) {
    if(!_.isEmpty(assetId)){
      $scope.errorMessage = undefined;
      $scope.isLoading    = true;
      $scope.playerId     = undefined; //reset from previous player

      debouncedFetchAssetInfoFromOoyala();
    }

    $scope.otBindInternalChangeHandler();
  }

  function fetchAssetInfoFromOoyala() {
    ooyalaClient.asset($scope.spaceContext.space.getOrganizationId(), $scope.assetId)
      .then(function(response){
        $scope.playerId    = response.player_id;
        $scope.playerReady = false;
      })
      .catch(function(){
        $scope.errorMessage = errorMessages.invalidAssetID;
        $scope.isLoading    = false;
      });
  }

  function handleClickOnRemoveSign() {
    $scope.assetId      = undefined;
    $scope.errorMessage = undefined;
    $scope.playerId     = undefined;
  }

  function handlePlayerReady() {
    /*
     * There's a 'race condition' which makes possible to have an error message
     * and the player at the same time in the UI: if the user types and invalid
     * asset id and fixes that very fast then the first request (for the invalid id)
     * will set the error message and the second one will load the player (but wihtout
     * removing the error message). So we have to clear the error after
     * every successful query to the API.
     *
     * We chose to do it here which is ugly and not clear at first sight why are we doing it.
     * We could clear it in the 'then' block in the fetchAssetInfoFromOoyala function
     * but then there would be a gap of time between the moment when we clear the value
     * and the moment when the player is shown leading to a ugly interface. Doing it here
     * removes that gap.
     */

    $scope.errorMessage = undefined;
    $scope.isLoading    = false;
    $scope.playerReady  = true;
  }

  function handlePlayerLoadFailure() {
    $scope.errorMessage = errorMessages.playerFailedToLoad;
    $scope.isLoading    = false;
    $scope.playerId     = undefined;
  }

  function handlePlayerFailedToPlayVideo() {
    $scope.errorMessage = errorMessages.playerFailedToPlayVideo;
  }
}]);
