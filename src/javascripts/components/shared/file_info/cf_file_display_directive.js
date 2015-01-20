'use strict';

angular.module('contentful').directive('cfFileDisplay', function () {
  return {
    restrict: 'A',
    template: JST.cf_file_display
  };
});
