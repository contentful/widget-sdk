'use strict';

angular.module('contentful').directive('cfYoutubeEditor', [function(){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_editor'](),

    controller: ['$scope', function($scope){
      $scope.$watch("url", function(){
        console.log('url', $scope.url);
        $scope.videoURL = $scope.url;
      });
    }],

  };
}]);
