angular.module('contentful/directives').directive('cfLogo', function () {
  'use strict';

  return {
    restrict: 'C',
    template: '<img class="logopart yellow" src="/app/logo_yellow.png"/><img class="logopart blue" src="/app/logo_blue.png"/><img class="logopart red" src="/app/logo_red.png"/>',
    link: function (scope, element) {
      var run;
      var start = function () {
        element.addClass('animate');
        run = true;
      };

      // Not useful anymore because incongruent timings
      //var stop = function () {
        //run = false;
        //element.find('.logopart.yellow').one('webkitAnimationIteration mozAnimationIteration animationIteration', function () {
          //if (run === false) stopImmediate();
        //});
      //};

      var stopImmediate = function () {
        element.removeClass('animate');
        run = false;
      };

      element.mouseover(start);
      element.mouseout(stopImmediate);
    }
  };
});
