'use strict';

angular.module('contentful').directive('cfSpaceSelector', function() {
  return {
    template: JST.cf_space_selector(),
    restrict: 'E',
    replace: true
  };
});
