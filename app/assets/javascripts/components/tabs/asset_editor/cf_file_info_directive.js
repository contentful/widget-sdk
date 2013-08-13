'use strict';

angular.module('contentful').directive('cfFileInfo', function () {
  return {
    restrict: 'C',
    template: JST['cf_file_info'],
    scope: {
      file: '=file',
      removeLink: '&removeLink'
    },
    link: function (scope) {
      scope.hasFile = !!scope.file;

      scope.showMeta = false;

      scope.toggleMeta = function () {
        scope.showMeta = !scope.showMeta;
      };

    }
  };
});
