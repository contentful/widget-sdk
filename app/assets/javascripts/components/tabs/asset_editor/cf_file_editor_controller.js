'use strict';

angular.module('contentful').controller('CfFileEditorCtrl', function ($scope) {
  $scope.$watch('file', function (file, old, scope) {
    scope.hasFile = !!file;
  });

  $scope.status = function () {
    if ($scope.file.upload) {
      return 'processing';
    } else if ($scope.file.url) {
      return 'ready';
    }
  };
});
