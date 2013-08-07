'use strict';

angular.module('contentful').directive('cfThumbnail', function () {
  var groupToIconMap = {
    image: 'image',
    video: 'video',
    audio: 'music',
    richtext: 'richtext',
    presentation: 'presentation',
    spreadsheet: 'spreadsheet',
    pdfdocument: 'pdf',
    archive: 'archive',
    plaintext: 'text',
    code: 'code',
    markup: 'html',
    attachment: 'attach'
  };

  function getExtension(fileName) {
    var ext = fileName.match(/\.\w+$/g);
    return ext && ext.length > 0 ? ext[0] : undefined;
  }

  return {
    restrict: 'A',
    template: JST['cf_thumbnail'],

    link: function (scope, el, attrs) {
      scope.thumbnailSize = attrs.size;
    },

    controller: ['$scope', 'mimetypeGroups', function ($scope, mimetypeGroups) {

      $scope.getIconName = function() {
        var groupName = mimetypeGroups.getName(
          getExtension($scope.file.fileName),
          $scope.file.contentType
        );

        return 'icon-'+groupToIconMap[groupName];
      };

      $scope.hasPreview = function(){
        return mimetypeGroups.hasPreview(
          getExtension($scope.file.fileName),
          $scope.file.contentType
        );
      };

    }]
  };
});
