'use strict';

angular.module('contentful').directive('cfFileInfo', function () {
  return {
    restrict: 'C',
    template: JST['cf_file_info'],
    scope: true,
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

    }
  };
});
