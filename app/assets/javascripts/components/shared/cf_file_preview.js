'use strict';

angular.module('contentful').directive('cfFilePreview', function ($compile, $window) {
  return {
    scope: true,
    link: function (scope, elem, attrs) {
      var $preview;
      var xOffset, yOffset;
      var maxWidth, maxHeight;
      var windowWidth, windowHeight, windowGap = 100;
      var fullscreen = attrs.previewSize == 'fullscreen';

      if (fullscreen) {
        elem.on('click', showFullscreen);
        windowWidth  = $(window).width();
        windowHeight = $(window).height();
        maxWidth  = windowWidth  - windowGap;
        maxHeight = windowHeight - windowGap;
      } else {
        elem.on('mousemove', mouseMoveHandler);
        elem.on('mouseout', mouseOutHandler);
        maxWidth  = parseInt(attrs.previewSize, 10) || 200;
        maxHeight = parseInt(attrs.previewSize, 10) || 200;
      }

      setDimensions();

      scope.$watch('file.details.image.width', function (fileWidth, old, scope) {
        if (fullscreen) {
          xOffset = (windowWidth - scope.width) / 2;
        } else {
          xOffset = Math.round(scope.width/2);
        }
      });

      scope.$watch('file.details.image.height', function (fileHeight, old, scope) {
        if (fullscreen) {
          yOffset = (windowHeight - scope.height) / 2;
        } else {
          yOffset = 15 + scope.height;
        }
      });

      function showFullscreen() {
        makePreview();
        _.defer(function () {
          $(window).one('click', removePreview);
        });
        $preview.css({
          top: yOffset,
          left: xOffset
        });
      }

      function mouseMoveHandler(event) {
        makePreview();
        $preview.css({
          top: event.pageY - yOffset,
          left: event.pageX - xOffset
        });
      }

      function mouseOutHandler() {
        removePreview();
      }

      function makePreview() {
        if ($preview) return;
        $preview = $compile('<img src="{{file.url}}?w={{width}}&h={{height}}" class="cf-file-preview" style="display:block; position: fixed; width: {{width}}px; height: {{height}}px; background: white">')(scope);
        $preview.appendTo($window.document.body);
        scope.$digest();
      }

      function removePreview() {
        if ($preview) {
          $preview.remove();
          $preview = null;
        }
        $(window).off('click', removePreview);
      }

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

      scope.$on('$destroy', removePreview);
    }
  };
});
