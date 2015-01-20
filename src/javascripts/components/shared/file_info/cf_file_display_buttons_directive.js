'use strict';

angular.module('contentful').directive('cfFileDisplayButtons', function () {
  return {
    restrict: 'A',
    template: JST.cf_file_display_buttons
  };
});
