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

      // TODO maybe refactor this so we can combine both directives and dont duplicate code
      scope.showMeta = false;

      scope.toggleMeta = function () {
        scope.showMeta = !scope.showMeta;
      };

    }
  };
});
