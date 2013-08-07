'use strict';

angular.module('contentful').directive('cfThumbnail', function () {
  var iconMap = {
    image: 'image',
    video: 'video',
    audio: 'music',
    document: 'richtext',
    pdfdocument: 'pdf',
    archive: 'archive',
    plaintext: 'text',
    code: 'code',
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

        return 'icon-'+iconMap[groupName];
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
