'use strict';

angular.module('contentful').directive('cfContextHistory', function () {
  return {
    template: JST.cf_context_history(),
    restrict: 'E',
    replace: true
  };
});
