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
    restrict: 'CA',
    template: JST['cf_thumbnail'],
    scope: {
      file: '=file'
    },
    link: function (scope, el, attrs) {
      var maxWidth, maxHeight;

      if (parseInt(attrs.size, 10) > 0) {
        maxWidth = maxHeight = parseInt(attrs.size, 10);
      } else {
        scope.$watch(function () {
          maxWidth  = el.width();
          maxHeight = el.height();
          return [maxWidth, maxHeight];
        }, dimensionsChanged, true);
      }

      scope.$watch('file', dimensionsChanged, true);

      function dimensionsChanged() {
        if (scope.file && scope.file.details && scope.file.details.image) {
          setDimensions(scope.file.details.image.width, scope.file.details.image.height);
        } else {
          setDimensions(0, 0);
        }
      }

      function setDimensions(srcWidth, srcHeight) {
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


    controller: ['$scope', 'mimetype', function ($scope, mimetype) {

      $scope.getIconName = function() {
        if ($scope.file) {
          var groupName = mimetype.getGroupName(
            mimetype.getExtension($scope.file.fileName),
            $scope.file.contentType
          );

          return 'icon-'+groupToIconMap[groupName];
        } else {
          return '';
        }
      };

      $scope.hasPreview = function(){
        return $scope.file && ($scope.file.external || hasPreview() && hasDimensions());
      };

      $scope.thumbnailUrl = function () {
        if ($scope.file && $scope.file.url && $scope.width && $scope.height) {
          var sizeQueryString = $scope.file.external ? '' : '?w=' + $scope.width + '&h=' + $scope.height;
          return '' + $scope.file.url + sizeQueryString;
        }
      };

      function hasDimensions () {
        return 0 < $scope.width && 0 < $scope.height;
      }

      function hasPreview() {
        return mimetype.hasPreview(
          mimetype.getExtension($scope.file.fileName),
          $scope.file.contentType
        );
      }

    }]
  };
});
