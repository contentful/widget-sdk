'use strict';

angular.module('contentful')
.directive('cfFileDisplayButtons', [function () {
  return {
    restrict: 'E',
    template: JST.cf_file_display_buttons,
    controller: ['$scope', function ($scope) {
      $scope.canEditFile = canEditFile;
      $scope.canDeleteFile = canDeleteFile;

      function canEditFile () {
        var file = $scope.file;
        var isReady = $scope.imageHasLoaded && file && file.url;
        return isEditable() && $scope.enableUpload && isReady;
      }

      function canDeleteFile () {
        var file = $scope.file;
        var uploaded = file && (file.url || file.upload);
        return isEditable() && $scope.deleteFile && uploaded;
      }

      function isEditable () {
        return dotty.get($scope, 'fieldLocale.access.editable', false);
      }
    }]
  };
}]);
