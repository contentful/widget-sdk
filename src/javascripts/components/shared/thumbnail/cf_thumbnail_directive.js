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
    restrict: 'CA',
    template: JST['cf_thumbnail'],
    scope: {
      file: '=file'
    },
    controller: 'ThumbnailController',
    link: function (scope, el, attrs) {
      var width, height;

      scope.fit = attrs.fit;
      scope.focus = attrs.focus;

      if (parseInt(attrs.size, 10) > 0) {
        width = height = parseInt(attrs.size, 10);
      } else {
        width = attrs.width || undefined;
        height = attrs.height || undefined;
      }

      scope.isImage = function(){
        return scope.file.external || scope.hasPreview();
      };

      scope.thumbnailUrl = function () {
        if (scope.file.external) return scope.file.url;

        var sizeQueryString = '?';
        if (scope.file.url && (width || height)) {
          if(width)  addQSParam('w', width);
          if(height) addQSParam('h', height);
          if(width && height){
            if(scope.fit)   addQSParam('fit', scope.fit);
            if(scope.focus) addQSParam('f', scope.focus);
          }
          return '' + scope.file.url + sizeQueryString;
        }

        function addQSParam(label, value) {
          sizeQueryString += label+'=' + value +'&';
        }
      };

    }
  };
});
