'use strict';

// TODO remove this directive. It is only a template
angular.module('contentful').directive('cfFileDisplay', function () {
  return {
    restrict: 'A',
    template: JST.cf_file_display
  };
});
