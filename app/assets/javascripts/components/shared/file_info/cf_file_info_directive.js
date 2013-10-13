'use strict';

angular.module('contentful').directive('cfFileInfo', function () {
  return {
    restrict: 'C',
    template: JST['cf_file_info'],
    scope: true,
    link: function (scope, elem, attrs) {
      attrs.$observe('file', function (val) {
        if(val) scope.file = scope.$eval(val);
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
