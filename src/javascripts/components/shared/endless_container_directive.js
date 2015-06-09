'use strict';

angular.module('contentful').directive('cfEndlessContainer', function(){
  return {
    restrict: 'A',
    link: function(scope, elem, attr) {
      elem.css({
        'overflow-y': 'auto'
      });

      function getThreshold() {
        var threshold = parseInt(attr.threshold, 10);
        return !isNaN(threshold) && threshold >= 0 ? threshold : 200;
      }

      var interval = setInterval(function() {
        if (!elem.is(':visible')) return;
        var scrollBottom = elem.scrollTop() + elem.prop('clientHeight');
        if (elem.prop('scrollHeight') - getThreshold() <= scrollBottom) {
          scope.$eval(attr.atBottom);
        }
      }, 400);

      scope.$watch(attr.numElements, function(numElements, old) {
        if (numElements === 0 && old > 0) {
          elem.prop('scrollTop', 0);
        }
      });

      scope.$on('$destroy', function() {
        clearInterval(interval);
        interval = 0;
      });

      elem.on('scroll', function() {
        elem.toggleClass('scrolled', elem.scrollTop() > 0);
      });
    }
  };
});

