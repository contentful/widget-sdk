'use strict';

angular.module('contentful').directive('cfFileDisplayButtons', function () {
  return {
    restrict: 'E',
    template: JST.cf_file_display_buttons,
    controller: ['$scope', '$state', function ($scope, $state) {

      $scope.tryOpenAsset = function () {
        if (hasValidEntity()) {
          $state.go('spaces.detail.assets.detail', {
            assetId: $scope.entity.getId(),
            addToContext: true
          });
        }
      };

      $scope.canOpenAsset = function () {
        return !$scope.enableUpload && hasValidEntity();
      };

      $scope.canEditFile = function () {
        var file = $scope.file;
        var isReady = $scope.imageHasLoaded && file && file.url;
        return $scope.fieldLocale.access.editable && $scope.enableUpload && isReady;
      };

      $scope.canDeleteFile = function () {
        var file = $scope.file;
        var uploaded = file && (file.url || file.upload);
        return $scope.fieldLocale.access.editable && $scope.deleteFile && uploaded;
      };

      function hasValidEntity () {
        var entity = $scope.entity;
        return _.isObject(entity) && _.isFunction(entity.getId)
      }
    }]
  };
});
