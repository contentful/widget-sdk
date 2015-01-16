'use strict';

angular.module('contentful').controller('ThumbnailController', ['$scope', 'mimetype', function ($scope, mimetype) {

  $scope.$watch('file', function (file) {
    if(!file) $scope.imageHasLoaded = false;
  });

  $scope.$on('imageLoaded', function () {
    console.log('image loaded');
    $scope.imageHasLoaded = true;
  });
  $scope.$on('imageUnloaded', function () {
    console.log('image unloaded');
    $scope.imageHasLoaded = false;
  });

  $scope.getIconName = getIconName;
  $scope.hasPreview = hasPreview;
  $scope.isFileLoading = isFileLoading;
  $scope.isFilePreviewable = isFilePreviewable;

  function getIconName() {
    var groupName = mimetype.getGroupName(
      mimetype.getExtension($scope.file.fileName),
      $scope.file.contentType
    );
    return groupToIcon(groupName);
  }

  function hasPreview() {
    return mimetype.hasPreview(
      mimetype.getExtension($scope.file.fileName),
      $scope.file.contentType
    );
  }

  function isFileLoading() {
    return $scope.file && $scope.file.url && $scope.hasPreview() && !$scope.imageHasLoaded;
  }

  function isFilePreviewable() {
    return ($scope.file && $scope.file.url && $scope.hasPreview() && $scope.imageHasLoaded) ||
           ($scope.file && $scope.file.url && !$scope.hasPreview());
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
