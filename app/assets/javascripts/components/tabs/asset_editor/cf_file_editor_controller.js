'use strict';

angular.module('contentful').controller('CfFileEditorCtrl', function ($scope, mimetypeGroups) {

  function getExtension(fileName) {
    return fileName.match(/\.\w+$/g);
  }

  function isInGroup(file, group){
    return group === mimetypeGroups.getName(
      getExtension(file.fileName),
      file.contentType
    );
  }

  $scope.$watch('file', function (file, old, scope) {
    scope.hasFile = !!file;
    if (file && !old) {
      scope.$emit('fileUploaded', file);
    } else if (!file && old) {
      scope.$emit('fileRemoved', old);
    }
  });

  $scope.status = function () {
    if ($scope.file.upload) {
      return 'processing';
    } else if ($scope.file.url) {
      return 'ready';
    }
  };

  _.each(mimetypeGroups.getGroupNames(), function (name) {
    $scope['is'+ name.charAt(0).toUpperCase() + name.slice(1)] = function () {
      return isInGroup($scope.file, name);
    };
  });

  $scope.hasPreview = function(){
    return mimetypeGroups.hasPreview(
      getExtension($scope.file.fileName),
      $scope.file.contentType
    );
  };

});
