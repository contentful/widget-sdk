'use strict';

angular.module('contentful').directive('cfMainNavBar', function() {
  return {
    template: JST.cf_main_nav_bar(),
    restrict: 'E',
    replace: true
  };
});
