'use strict';

/**
 * Check all available options for thumbnailing service at:
 * https://github.com/contentful/image-manipulation-proxy/blob/master/test_page/test.js
 *
 * Usage:
 * <div cf-thumbnail
 *   file="fileObject"
 *   size="pixels" // if size is used, width and height are ignored
 *   width="pixels" // can be used with height or by itself
 *   height="pixels" // can be used with width or by itself
 *   fit="scale|crop|pad|thumb"
 *   focus="bottom|right|bottom_right|face|faces|..."
 *   ></div>
 */

angular.module('contentful').directive('cfThumbnail', function () {
  return {
    restrict: 'AE',
    template: JST['cf_thumbnail'],
    scope: {
      file: '='
    },
    controller: 'ThumbnailController',
    link: function (scope, _el, attrs) {
      var width, height;

      scope.fit = attrs.fit;
      scope.focus = attrs.focus;

      if (parseInt(attrs.size, 10) > 0) {
        width = height = parseInt(attrs.size, 10);
      } else {
        width = attrs.width || undefined;
        height = attrs.height || undefined;
      }

      scope.imageStyle = {
        width: width ? width + 'px' : '',
        height: height ? height + 'px' : ''
      };

      scope.isImage = function () {
        return scope.hasPreview();
      };

      scope.thumbnailUrl = function () {
        var sizeQueryString = '?';
        if (scope.file.url && (width || height)) {
          if (width) addQSParam('w', width);
          if (height) addQSParam('h', height);
          if (width && height) {
            if (scope.fit) addQSParam('fit', scope.fit);
            if (scope.focus) addQSParam('f', scope.focus);
          }
          return '' + scope.file.url + sizeQueryString;
        }

        function addQSParam (label, value) {
          sizeQueryString += label + '=' + value + '&';
        }
      };

    }
  };
});
