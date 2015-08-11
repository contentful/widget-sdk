'use strict';

angular.module('contentful').directive('cfApiHome', function() {
  return {
    template: JST['api_home'](),
    restrict: 'A'
  };
});
