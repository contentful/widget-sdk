'use strict';

angular.module('contentful').directive('cfImgLoadEvent', [function () {
  return {
    link: function (scope, elem, attrs) {

      // This should always fire, if the src changes, even if the src is not
      // empty because we want to detect when an old image is unloaded and
      // when a new image is loaded, the imageLoaded event will fire
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
