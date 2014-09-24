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

      //$scope.handleChange = _.debounce(handleInputChange, 250, {maxWait: 750});

      //function handleInputChange(){
      //  console.log('input change')
      //  $scope.videoURL = $scope.url;
      //  $scope.otBindInternalChangeHandler();
      //}
    }],

  };
}]);
