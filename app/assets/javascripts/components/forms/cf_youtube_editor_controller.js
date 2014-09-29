'use strict';

angular.module('contentful').controller('cfYoutubeEditorController', ['$injector', '$scope', function($injector, $scope){
  var YoutubeUrl = $injector.get('YoutubeUrl');

  $scope.$watch('url', updateYoutubeUrl);

  $scope.isPlayerLoading = false;
  $scope.youtubePlayerDelegate = {
    handlePlayerReady: function(){},
    handlePlayerReadyToPlayVideo: function(){
      $scope.$apply('isPlayerLoading = false');
    },
    handlePlayerFailedToLoadVideo: function() {
      $scope.$apply('isPlayerLoading = false');
    }
  };

  function updateYoutubeUrl(newVal, oldVal) {
    if (newVal == oldVal) return;

    $scope.isPlayerLoading = true;
    $scope.youtubeUrl      = new YoutubeUrl($scope.url);

    $scope.otBindInternalChangeHandler();
  }

}]);
