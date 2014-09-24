'use strict';

angular.module('contentful').directive('cfYoutubeEditor', [function(){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_editor'](),

    controller: ['$scope', function($scope){
      $scope.handleChange = _.debounce(handleInputChange, 250, {maxWait: 750});

      function handleInputChange(){
        $scope.videoURL = $scope.url;
      }
    }],

  };
}]);
