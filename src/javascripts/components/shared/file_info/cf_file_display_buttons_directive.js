'use strict';

angular.module('contentful')
.directive('cfFileDisplayButtons', ['require', function (require) {
  var mimetype = require('mimetype');

  return {
    restrict: 'E',
    template: JST.cf_file_display_buttons,
    controller: ['$scope', function ($scope) {
      $scope.canEditFile = canEditFile;
      $scope.canDeleteFile = canDeleteFile;

      function canEditFile () {
        var file = $scope.file;
        var isReady = !$scope.imageIsLoading && file && file.url;
        return isEditable() && isImage() && $scope.enableUpload && isReady;
      }

      function canDeleteFile () {
        var file = $scope.file;
        var uploaded = file && (file.url || file.upload);
        return isEditable() && $scope.deleteFile && uploaded;
      }

      function isEditable () {
        return _.get($scope, 'fieldLocale.access.editable', false);
      }

      function isImage () {
        var fileType = _.get($scope, 'file.contentType', '');
        return mimetype.getGroupLabel({type: fileType}) === 'image';
      }
    }]
  };
}]);
