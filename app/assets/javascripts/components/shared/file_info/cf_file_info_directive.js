'use strict';

angular.module('contentful').directive('cfFileInfo', function () {
  return {
    restrict: 'C',
    template: JST['cf_file_info'],
    scope: {
      file: '=file',
      title: '=entityTitle',
      removeLink: '&removeLink',
      editEntity: '&editEntity'
    },
    link: function (scope) {
      scope.showMeta = false;

      scope.toggleMeta = function () {
        scope.showMeta = !scope.showMeta;
      };

    }
  };
});
