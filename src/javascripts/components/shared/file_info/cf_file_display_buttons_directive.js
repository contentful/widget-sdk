'use strict';

angular.module('contentful').directive('cfFileDisplayButtons', function () {
  return {
    restrict: 'E',
    template: JST.cf_file_display_buttons,
    controller: ['$scope', '$state', function ($scope, $state) {

      $scope.tryOpenAsset = function () {
        var entity = $scope.entity;
        if (entity && !entity.isMissing) {
          $state.go('spaces.detail.assets.detail', {
            assetId: entity.getId(),
            addToContext: true
          });
        }
      };

      $scope.canOpenAsset = function () {
        return !$scope.enableUpload && $scope.entity && !$scope.entity.isMissing;
      };

      $scope.canEditFile = function () {
        var file = $scope.file;
        var isReady = $scope.imageHasLoaded && file && file.url;
        return !$scope.otDisabled && $scope.enableUpload && isReady;
      };

      $scope.canDeleteFile = function () {
        var file = $scope.file;
        var uploaded = file && (file.url || file.upload);
        return !$scope.otDisabled && $scope.deleteFile && uploaded;
      };

    }]
  };
});
