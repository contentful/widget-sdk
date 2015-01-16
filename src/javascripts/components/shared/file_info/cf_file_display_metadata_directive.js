'use strict';

angular.module('contentful').directive('cfFileDisplayMetadata', function () {
  return {
    restrict: 'A',
    template: JST.cf_file_display_metadata
  };
});
