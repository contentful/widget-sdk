'use strict';

angular.module('contentful').directive('cfFilePreview', function ($compile, $window) {
  return {
    scope: true,
    link: function (scope, elem, attrs) {
      var $preview;
      var xOffset, yOffset, scale;

      elem.on('mousemove', mouseMoveHandler);
      elem.on('mouseout', mouseOutHandler);

      scope.$watch(function () {
        return attrs.previewSize || 200;
      }, function (previewSize) {
        var aspect = scope.file.details.image.width / scope.file.details.image.height;
        scale = 1 < aspect ?
          scope.file.details.image.width  / previewSize :
          scope.file.details.image.height / previewSize;
      });

      scope.$watch('file.details.image.width', function (fileWidth, old, scope) {
        scope.width = Math.round(fileWidth / scale);
        xOffset = Math.round(scope.width/2);
      });

      scope.$watch('file.details.image.height', function (fileHeight, old, scope) {
        scope.height = Math.round(fileHeight / scale);
        yOffset = 15 + scope.height;
      });

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
      }

      scope.$on('$destroy', removePreview);
    }
  };
});
