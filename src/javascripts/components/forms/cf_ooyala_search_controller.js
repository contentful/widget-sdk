'use strict';

angular.module('contentful').controller('cfOoyalaSearchController', ['$attrs', '$scope', '$injector', function($attrs, $scope, $injector){
  var OoyalaSearch         = $injector.get('OoyalaSearch');
  var debounce             = $injector.get('debounce');
  var debouncedQueryOoyala = debounce(queryOoyala, 750);

  var search, currentPlayer;

  $scope.videos                     = [];
  $scope.selection                  = [];
  $scope.searchFinished             = false;
  $scope.isSearching                = false;
  $scope.isMultipleSelectionEnabled = $scope.$eval($attrs.isMultipleSelectionEnabled);

  $scope.$watch('ooyala.search', updateSearchTerm);

  $scope.loadMore           = loadMore;
  $scope.selectVideo        = selectVideo;
  $scope.deselectVideo      = deselectVideo;
  $scope.pauseCurrentPlayer = pauseCurrentPlayer;

  this.getSelected     = getSelected;

  function updateSearchTerm(term) {
    if(!_.isEmpty(term)){
      $scope.isSearching = true;
      debouncedQueryOoyala();
    }

    $scope.errorMessage   = undefined;
    $scope.searchFinished = false;
    $scope.videos         = [];
    search                = undefined;
  }

  function queryOoyala() {
    search = new OoyalaSearch({organizationId: $scope.spaceContext.space.getOrganizationId()});
    search.where('name', $scope.ooyala.search).limit(10);
    search.run()
      .then(searchDone)
      .catch(processError);
  }

  function loadMore() {
    if (search && search.isPaginable()) {
      $scope.isSearching = true;
      search.nextPage().then(searchDone);
    }
  }

  function insertResults(response) {
    $scope.videos = $scope.videos.concat(response.map(function(i){
      return {
        id: i.embed_code,
        playerId: i.player_id,
        name: i.name,
        duration: i.duration,
        thumbnailUrl: i.preview_image_url
      };
    }));
  }

  function searchDone(response) {
    $scope.isSearching    = false;
    $scope.searchFinished = true;
    insertResults(response);
  }

  function pauseCurrentPlayer(player) {
    if (currentPlayer && currentPlayer != player) currentPlayer.pauseVideo();
    currentPlayer = player;
  }

  function processError(error) {
    $scope.isSearching  = false;
    $scope.errorMessage = error.message;
  }

  function selectVideo(video) {
    if (!$scope.isMultipleSelectionEnabled){
      $scope.selection.pop();
      //TODO: rename this event followin naming conventions
      //https://contentful.atlassian.net/wiki/display/ENG/AngularJS+Coding+Guidelines#AngularJSCodingGuidelines-Namingthings
      $scope.$broadcast('video:selected', {video: video});
    }

    $scope.selection.unshift(video);
  }

  function deselectVideo(video) {
    $scope.selection.splice($scope.selection.indexOf(video), 1);
  }

  function getSelected() {
    return $scope.selection;
  }
}]);
