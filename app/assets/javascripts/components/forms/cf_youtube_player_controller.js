'use strict';

angular.module('contentful').controller('cfYoutubePlayerController', ['$injector', '$scope', function($injector, $scope){

  var youtubeGAPIAdapter     = $injector.get('youtubeGAPIAdapter');

  $scope.startWatchingYoutubeUrl = startWatchingYoutubeUrl;

  function startWatchingYoutubeUrl() {
    $scope.$watch('youtubeUrl', youtubeUrlChanged);
  }

  function youtubeUrlChanged(youtubeUrl){
    youtubeGAPIAdapter.videoInfo(youtubeUrl.videoId())
    .then(updateVideoInfo);
    $scope.cueVideoById(youtubeUrl.videoId());
  }

  function updateVideoInfo(info){
    $scope.title = info.title;
  }

}]);

