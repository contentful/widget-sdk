'use strict';

angular.module('contentful').directive('cfImgLoadEvent', [function () {
  return {
    link: function (scope, elem, attrs) {
      scope.$watch(function(){
        return attrs.src;
      }, function(src, old){
        if (src !== old) scope.$emit('imageUnloaded', elem);
      });

      elem.on('load', function () {
        scope.$apply(function () {
          scope.$emit('imageLoaded', elem);
        });
      });
    }
  };
}]);
