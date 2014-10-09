'use strict';

angular.module('contentful').controller('cfOoyalaEditorController', ['$scope', '$injector', function($scope, $injector){

  var OoyalaErrorMessages = $injector.get('OoyalaErrorMessages');
  var ooyalaClient        = $injector.get('ooyalaClient');
  var debounce            = $injector.get('debounce');
  var modalDialog         = $injector.get('modalDialog');

  ooyalaClient.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  var debouncedFetchAssetInfoFromOoyala = debounce(fetchAssetInfoFromOoyala, 750);

  $scope.$watch('fieldData.value', fetchAssetInfo);

  $scope.isLoading     = false;
  $scope.playerReady   = false;
  $scope.selectedVideo = {};

  $scope.handleClickOnSearchButton     = handleClickOnSearchButton;
  $scope.handleClickOnRemoveSign       = handleClickOnRemoveSign;
  $scope.handlePlayerReady             = handlePlayerReady;
  $scope.handlePlayerLoadFailure       = handlePlayerLoadFailure;
  $scope.handlePlayerFailedToPlayVideo = handlePlayerFailedToPlayVideo;

  function fetchAssetInfo(assetId) {
    $scope.selectedVideo.assetId = assetId;

    if(!_.isEmpty(assetId)){
      $scope.errorMessage           = undefined;
      $scope.isLoading              = true;
      $scope.selectedVideo.playerId = undefined; //reset from previous player

      debouncedFetchAssetInfoFromOoyala();
    }
  }

  function fetchAssetInfoFromOoyala() {
    ooyalaClient.asset($scope.selectedVideo.assetId)
      .then(function(response){
        $scope.playerReady = false;
        $scope.selectedVideo.playerId = response.player_id;
      })
      .catch(function(error){
        $scope.errorMessage = error.message;
        $scope.isLoading    = false;
      });
  }

  function handleClickOnSearchButton() {
    modalDialog.open({
      scope: $scope,
      template: 'cf_ooyala_search_dialog'
    }).then(function(video){
      $scope.otChangeValueP(video.id).then(function(){
        $scope.fieldData.value = video.id;
      });
    });
  }

  function handleClickOnRemoveSign() {
    $scope.otChangeValueP(undefined).then(function(){
      $scope.selectedVideo   = {};
      $scope.fieldData.value = undefined;
      $scope.errorMessage    = undefined;
    });
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
    $scope.errorMessage           = OoyalaErrorMessages.playerFailedToLoad;
    $scope.isLoading              = false;
    $scope.selectedVideo.playerId = undefined;
  }

  function handlePlayerFailedToPlayVideo() {
    $scope.errorMessage = OoyalaErrorMessages.playerFailedToPlayVideo;
  }
}]);
