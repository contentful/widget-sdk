'use strict';
angular.module('contentful').directive('cfTutorialWelcome', function(){
  return {
    restrict: 'C',
    scope: true,
    link: function(scope){
      scope.slides = ['overview', 'structure', 'content', 'delivery', 'tutorials'];
      scope.currentSlide = 'overview';
      scope.setCurrent = function (slide) { scope.currentSlide = slide; };
      scope.atFirstSlide = function () { return scope.currentSlide === scope.slides[0]; };
      scope.atLastSlide = function () { return scope.currentSlide === scope.slides[scope.slides.length-1]; };
      scope.moveSlide = function (offset) {
        var index = _.indexOf(scope.slides, scope.currentSlide);
        scope.currentSlide = scope.slides[index+offset];
      };
    }
  };
});
