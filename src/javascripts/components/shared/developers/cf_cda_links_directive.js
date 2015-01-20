'use strict';

angular.module('contentful').directive('cfCdaLinks', function() {
  return {
    template: JST['cf_cda_links'](),
    restrict: 'C'
  };
});
