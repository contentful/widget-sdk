'use strict';

angular.module('contentful').directive('cfImgLoadEvent', [function () {
  return {
    link: function (scope, elem, attrs) {
      scope.$watch(attrs.src, function () {
        scope.$emit('imageUnloaded', elem);
      });

      elem.on('load', function () {
        scope.$apply(function () {
          scope.$emit('imageLoaded', elem);
        });
      });
    }
  };
}]);
