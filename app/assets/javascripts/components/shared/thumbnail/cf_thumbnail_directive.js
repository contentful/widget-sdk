'use strict';

/**
 * Check all available options for thumbnailing service at:
 * https://github.com/contentful/image-manipulation-proxy/blob/master/app_engine_proxy/test_page/test.js
 */

angular.module('contentful').directive('cfThumbnail', function () {
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

  return {
    restrict: 'CA',
    template: JST['cf_thumbnail'],
    scope: {
      file: '=file'
    },
    link: function (scope, el, attrs) {
      var maxWidth, maxHeight;

      scope.format = attrs.format;
      scope.fit = attrs.fit;
      scope.focus = attrs.focus;

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

        if(scope.format == 'square') {
          resizeWidth = maxWidth;
          resizeHeight = maxHeight;
        } else {
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

          return groupToIcon(groupName);
        } else {
          return '';
        }
      };

      $scope.hasPreview = function(){
        return $scope.file && ($scope.file.external || hasPreview() && hasDimensions());
      };

      $scope.thumbnailUrl = function () {
        if ($scope.file.external) return $scope.file.url;

        if ($scope.file && $scope.file.url && $scope.width  && $scope.height ) {
          var sizeQueryString = '?w=' + $scope.width + '&h=' + $scope.height;
          if($scope.fit) sizeQueryString += '&fit='+$scope.fit;
          if($scope.focus) sizeQueryString += '&f='+$scope.focus;
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
