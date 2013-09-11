'use strict';

angular.module('contentful').directive('cfFilePreview', function ($compile, $window) {
  return {
    scope: {
      file: '=cfFilePreview'
    },
    link: function (scope, elem, attrs) {
      var $preview;
      var xOffset, yOffset;
      var maxWidth, maxHeight;
      var windowWidth, windowHeight, windowGap = 100;
      var fullscreen = attrs.previewSize == 'fullscreen';

      if (fullscreen) {
        elem.on('click', showFullscreen);
      } else {
        elem.on('mousemove', mouseMoveHandler);
        elem.on('mouseout', mouseOutHandler);
      }

      scope.$watch('file', setSizes, true);

      function setSizes() {
        if(isImage()) {
          if (fullscreen) {
            windowWidth  = $(window).width();
            windowHeight = $(window).height();
            maxWidth  = windowWidth  - windowGap;
            maxHeight = windowHeight - windowGap;
            setDimensions(scope.file.details.image.width, scope.file.details.image.height);
            xOffset = (windowWidth - scope.width) / 2;
            yOffset = (windowHeight - scope.height) / 2;
          } else {
            maxWidth  = parseInt(attrs.previewSize, 10) || 200;
            maxHeight = parseInt(attrs.previewSize, 10) || 200;
            setDimensions(scope.file.details.image.width, scope.file.details.image.height);
            xOffset = Math.round(scope.width/2);
            yOffset = 15 + scope.height;
          }
        }
      }

      function showFullscreen() {
        if (!isImage()) return;
        makePreview();
        _.defer(function () {
          $(document).one('click', removePreview);
        });
        $preview.css({
          top: yOffset,
          left: xOffset
        });
      }

      function mouseMoveHandler(event) {
        if (!isImage()) return;
        makePreview();
        var vertOffset = event.pageY - yOffset;
        if(vertOffset < 0)
          vertOffset = event.pageY + 10;
        $preview.css({
          top: vertOffset,
          left: event.pageX - xOffset
        });
      }

      function resizeHandler() {
        setSizes();
        $preview.css({
          top: yOffset,
          left: xOffset
        });
        scope.$digest();
      }

      function mouseOutHandler() {
        removePreview();
      }

      function makePreview() {
        if ($preview || scope.width == 0 || scope.height == 0) return;
        angular.element($window).on('resize', resizeHandler);
        setSizes();
        $preview = $compile('<img ng-src="{{file.url}}?w={{width}}&h={{height}}" class="cf-file-preview" style="display:block; position: fixed; width: {{width}}px; height: {{height}}px; background: white">')(scope);
        $preview.appendTo($window.document.body);
        scope.$digest();
      }

      function removePreview() {
        if ($preview) {
          $preview.remove();
          $preview = null;
        }
        $($window).
          off('click', removePreview).
          off('resize', resizeHandler);
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

      function isImage() {
        return !!(scope.file && scope.file.details && scope.file.details.image);
      }

      scope.$on('$destroy', removePreview);
    }
  };
});
