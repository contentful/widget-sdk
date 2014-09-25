'use strict';

angular.module('contentful').directive('cfYoutubeEditor', ['youtubeGAPIAdapter', function(youtubeGAPIAdapter){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_editor'](),

    link: function(scope) {
      scope.youtubePlayerDelegate = {
        handlePlayerReady: function(){
          console.log("DELEGATE: READY")
        },
        handlePlayerReadyToPlayVideo: function(){
          console.log("DELEGATE: READY TO PLAY VIDEO")
        },
        handlePlayerFailedToLoadVideo: function() {
          console.log("DELEGATE: CANT LOAD VIDEO")
        }
      }
    },

    controller: ['$scope', function($scope){
      $scope.$watch("url", function(){
        console.log('url', $scope.url);
        $scope.videoURL = $scope.url;

        youtubeGAPIAdapter.videoInfo('ZAg7NTSL8ow').then(function(items){
          $scope.title = items[0].snippet.title;
        });

      });
    }],

  };
}]);
