'use strict';

angular.module('contentful').directive('cfCmaLinks', function() {
  return {
    template: JST['cf_cma_links'](),
    restrict: 'C'
  };
});
