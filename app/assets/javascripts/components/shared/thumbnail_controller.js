'use strict';

angular.module('contentful').controller('ThumbnailController', ['$scope', 'mimetype', function ($scope, mimetype) {

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

  $scope.getIconName = function() {
    var groupName = mimetype.getGroupName(
      mimetype.getExtension($scope.file.fileName),
      $scope.file.contentType
    );

    return groupToIcon(groupName);
  };

  $scope.hasPreview = function() {
    return mimetype.hasPreview(
      mimetype.getExtension($scope.file.fileName),
      $scope.file.contentType
    );
  };

}]);
