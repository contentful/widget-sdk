angular.module('contentful').directive('cfLogo', function () {
  'use strict';

  return {
    restrict: 'C',
    template: '<div class="logopart yellow"/><div class="logopart blue"/><div class="logopart red"/>'
  };
});
