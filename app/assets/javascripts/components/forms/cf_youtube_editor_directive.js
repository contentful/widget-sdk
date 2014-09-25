'use strict';

angular.module('contentful').directive('cfYoutubeEditor', ['YoutubeUrl', function(YoutubeUrl){
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
        $scope.youtubeUrl = new YoutubeUrl($scope.url);
      });
    }],

  };
}]);
