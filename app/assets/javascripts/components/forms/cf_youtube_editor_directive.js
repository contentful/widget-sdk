'use strict';

angular.module('contentful').directive('cfYoutubeEditor', ['YoutubeUrl', function(YoutubeUrl){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_editor'](),

    link: function(scope) {
      scope.isPlayerLoading = false;
      scope.youtubePlayerDelegate = {
        handlePlayerReady: function(){
          console.log("DELEGATE: READY")
        },
        handlePlayerReadyToPlayVideo: function(){
          scope.$apply("isPlayerLoading = false");
          console.log("DELEGATE: READY TO PLAY VIDEO")
        },
        handlePlayerFailedToLoadVideo: function() {
          scope.$apply("isPlayerLoading = false");
          console.log("DELEGATE: CANT LOAD VIDEO")
        }
      };
    },

    controller: ['$scope', function($scope){
      $scope.$watch("url", function(newVal, oldVal){
        if (newVal == oldVal) return;

        $scope.isPlayerLoading = true;
        $scope.youtubeUrl = new YoutubeUrl($scope.url);

        $scope.otBindInternalChangeHandler();
      });
    }],

  };
}]);
