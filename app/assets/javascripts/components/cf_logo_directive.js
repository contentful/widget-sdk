angular.module('contentful').directive('cfLogo', ['cfSpinner', function (cfSpinner) {
  'use strict';

  return {
    restrict: 'C',
    template: '<div class="logopart yellow"/><div class="logopart blue"/><div class="logopart red"/>',
    link: function (scope, element) {
      var start = function () {
        element.addClass('animate');
      };

      var stop = function () {
        element.removeClass('animate');
      };

      cfSpinner.setCallback(function (state) {
        if (state) {
          start();
        } else {
          stop();
        }
      });
    }
  };
}]);
