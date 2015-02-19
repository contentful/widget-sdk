'use strict';

angular.module('contentful').directive('cfAccountBar', function() {
  return {
    template: JST.cf_account_bar(),
    restrict: 'E',
    replace: true
  };
});
