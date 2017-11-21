'use strict';

angular.module('contentful').controller('cfVideoSearchController', ['$scope', 'require', function($scope, require){
  var debounce                    = require('debounce');
  var debouncedQueryVideoProvider = debounce(queryVideoProvider, 750);

  var currentSearch, currentPlayer;
  var searchConfig = ($scope.videoEditor || $scope.multiVideoEditor).searchConfig;

  $scope.videoSearch = {
    videos                     : [],
    selection                  : [],
    searchFinished             : false,
    isSearching                : false,
    player : {
      widgetPlayerDirective : searchConfig.widgetPlayerDirective,
      customAttrsForPlayer  : searchConfig.customAttrsForPlayer
    }
  };

  $scope.$watch('videoSearch.searchTerm', updateSearchTerm);

  this.loadMore           = loadMore;
  this.selectVideo        = selectVideo;
  this.deselectVideo      = deselectVideo;
  this.pauseCurrentPlayer = pauseCurrentPlayer;
  this.getSelected        = getSelected;

  function updateSearchTerm(term) {
    $scope.errorMessage               = undefined;
    $scope.videoSearch.searchFinished = false;
    $scope.videoSearch.videos         = [];
    currentSearch                     = undefined;

    if(!_.isEmpty(term)){
      $scope.videoSearch.isSearching = true;
      debouncedQueryVideoProvider();
    }
  }

  function queryVideoProvider() {
    currentSearch = searchConfig.prepareSearch($scope.videoSearch.searchTerm);
    currentSearch.run()
      .then(searchDone)
      .catch(processError);
  }

  function loadMore() {
    if (currentSearch && currentSearch.isPaginable()) {
      $scope.videoSearch.isSearching = true;
      currentSearch.nextPage().run().then(searchDone);
    }
  }

  function searchDone(response) {
    $scope.videoSearch.isSearching    = false;
    $scope.videoSearch.searchFinished = true;
    $scope.videoSearch.videos = $scope.videoSearch.videos.concat(searchConfig.processSearchResults(response));
  }

  function pauseCurrentPlayer(player) {
    if (currentPlayer && currentPlayer != player) currentPlayer.pauseVideo();
    currentPlayer = player;
  }

  function processError(error) {
    $scope.videoSearch.isSearching = false;
    $scope.errorMessage            = error.message;
  }

  function selectVideo(video) {
    if (!searchConfig.isMultipleSelectionEnabled){
      $scope.videoSearch.selection.pop();
      //TODO: rename this event followin naming conventions
      //https://contentful.atlassian.net/wiki/display/ENG/AngularJS+Coding+Guidelines#AngularJSCodingGuidelines-Namingthings
      $scope.$broadcast('video:selected', {video: video});
    }

    $scope.videoSearch.selection.unshift(video);
  }

  function deselectVideo(video) {
    $scope.videoSearch.selection.splice($scope.videoSearch.selection.indexOf(video), 1);
  }

  function getSelected() {
    return $scope.videoSearch.selection;
  }
}]);
