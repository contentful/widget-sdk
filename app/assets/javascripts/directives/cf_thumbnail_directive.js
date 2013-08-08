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

     if(scope.file && scope.file.details.image)
       setDimensions(scope.file.details.image);

     function setDimensions(image) {
       var srcWidth = image.width;
       var srcHeight = image.height;

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
          mimetypeGroups.getExtension($scope.file.fileName),
          $scope.file.contentType
        );

        return 'icon-'+groupToIconMap[groupName];
      };

      $scope.hasPreview = function(){
        return mimetypeGroups.hasPreview(
          mimetypeGroups.getExtension($scope.file.fileName),
          $scope.file.contentType
        );
      };

    }]
  };
});
