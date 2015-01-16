'use strict';

angular.module('contentful').directive('cfFileMetadata', ['mimetype', function (mimetype) {
  return {
    restrict: 'A',
    scope: true,
    controller: 'ThumbnailController',
    link: function (scope, elem, attrs) {
      scope.$watch(attrs.file, function (val) {
        if(val) scope.file = val;
      });
      scope.$watch(attrs.entityTitle, function (val) {
        if(val) scope.title = val;
      });

      scope.showMeta = false;

      scope.toggleMeta = function () {
        scope.showMeta = !scope.showMeta;
      };

      scope.isImage = function () {
        return scope.file && mimetype.getGroupName(
            mimetype.getExtension(scope.file.fileName),
            scope.file.contentType
          ) == 'image';
      };

    }
  };
}]);
