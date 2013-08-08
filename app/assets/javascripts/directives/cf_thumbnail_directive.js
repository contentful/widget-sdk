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
    scope: {
      file: '=cfThumbnail'
    },
    link: function (scope, el, attrs) {
      var maxWidth, maxHeight;

     if (angular.isDefined(attrs.size)) {
       maxWidth = maxHeight = attrs.size;
     } else {
       maxWidth  = el.width();
       maxHeight = el.height();
     }

     setDimensions();

     function setDimensions() {
       var srcWidth = scope.file.details.image.width;
       var srcHeight = scope.file.details.image.height;

       var resizeWidth = srcWidth;
       var resizeHeight = srcHeight;

       var aspect = resizeWidth / resizeHeight;

       if (resizeWidth > maxWidth) {
           resizeWidth = maxWidth;
           resizeHeight = resizeWidth / aspect;
       }
       if (resizeHeight > maxHeight) {
           aspect = resizeWidth / resizeHeight;
           resizeHeight = maxHeight;
           resizeWidth = resizeHeight * aspect;
       }

       scope.width  = Math.round(resizeWidth);
       scope.height = Math.round(resizeHeight);
     }
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
