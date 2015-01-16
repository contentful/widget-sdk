'use strict';

angular.module('contentful').controller('ThumbnailController', ['$scope', 'mimetype', function ($scope, mimetype) {

  $scope.$watch('file', function (file) {
    if(!file) $scope.imageHasLoaded = false;
  });

  $scope.$on('imageLoaded', function () {
    $scope.imageHasLoaded = true;
  });
  $scope.$on('imageUnloaded', function () {
    $scope.imageHasLoaded = false;
  });

  $scope.isFileLoading = isFileLoading;
  $scope.isFilePreviewable = isFilePreviewable;
  $scope.hasPreview = hasPreview;
  $scope.getIconName = getIconName;

  function isFileLoading() {
    return $scope.hasPreview() && !$scope.imageHasLoaded;
  }

  function isFilePreviewable() {
    return !$scope.hasPreview() ||
           $scope.hasPreview() && $scope.imageHasLoaded;
  }

  function hasPreview() {
    return mimetype.hasPreview(
      mimetype.getExtension($scope.file.fileName),
      $scope.file.contentType
    );
  }

  function getIconName() {
    var groupName = mimetype.getGroupName(
      mimetype.getExtension($scope.file.fileName),
      $scope.file.contentType
    );
    return groupToIcon(groupName);
  }

  var groupToIconMap = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    richtext: 'word',
    presentation: 'powerpoint',
    spreadsheet: 'excel',
    pdfdocument: 'pdf',
    archive: 'zip',
    plaintext: 'text',
    code: 'code',
    markup: 'code'
  };

  function groupToIcon(name) {
    if(name in groupToIconMap) return 'fa fa-file-'+groupToIconMap[name]+'-o';
    return 'fa fa-paperclip';
  }


}]);
