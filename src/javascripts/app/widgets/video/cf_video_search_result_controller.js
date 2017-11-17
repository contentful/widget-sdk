'use strict';

angular.module('contentful').controller('cfVideoSearchResultController', ['$scope', 'require', function ($scope, require){
  var controller = this;
  var moment     = require('moment');

  $scope.videoSearchResult = {
    isPlaying        : false,
    isPlayerEnabled  : false,
    isPlayerLoading  : false,
    isResultSelected : false,
    showPlayer       : false,
    showPreview      : true,
    formattedDuration : formatVideoDuration('%h:%m:%s')
  };

  $scope.$on('video:selected', deselectVideo);

  this.pauseVideo  = pauseVideo;
  this.playVideo   = playVideo;
  this.selectVideo = selectVideo;
  this.setVideoNotPlaying = setVideoNotPlaying;

  this.handlePlayerReady = handlePlayerReady;

  function pauseVideo() {
    $scope.videoSearchResult.isPlaying = false;
    $scope.videoPlayerController().pause();
  }

  function playVideo() {
    if( !$scope.videoSearchResult.isPlayerEnabled ) {
      $scope.videoSearchResult.isPlayerEnabled = true;
      $scope.videoSearchResult.isPlayerLoading = true;
    } else {
      $scope.videoPlayerController().play();
    }

    $scope.videoSearchController.pauseCurrentPlayer(controller);
    $scope.videoSearchResult.showPreview = false;
    $scope.videoSearchResult.isPlaying   = true;
  }

  function selectVideo() {
    $scope.videoSearchResult.isResultSelected = $scope.videoSearchResult.isResultSelected !== true;

    if ($scope.videoSearchResult.isResultSelected) {
      $scope.videoSearchController.selectVideo($scope.video);
    } else {
      $scope.videoSearchController.deselectVideo($scope.video);
    }
  }

  function setVideoNotPlaying() {
    $scope.videoSearchResult.isPlaying = false;
  }

  function deselectVideo(e, data) {
    if (data.video != $scope.video) $scope.videoSearchResult.isResultSelected = false;
  }

  function handlePlayerReady() {
    $scope.videoSearchResult.isPlayerLoading = false;
    $scope.videoSearchResult.showPlayer      = true;
  }

  function formatVideoDuration(format) {
    var duration = moment.duration($scope.video.duration);

    function pad(number) {
      return number < 10 ? '0' + number : number;
    }

    return  format
            .replace('%h', pad(duration.hours()))
            .replace('%m', pad(duration.minutes()))
            .replace('%s', pad(duration.seconds()));
  }
}]);
