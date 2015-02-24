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

      var reloadInProgress;

      var interval = setInterval(function() {
        if (!elem.is(':visible')) return;
        var scrollBottom = elem.scrollTop() + elem.prop('clientHeight');
        //console.log('scrolling', scrollBottom);
        if (elem.prop('scrollHeight') - getThreshold() <= scrollBottom) {
          reloadInProgress = true;
          try {
            //console.log('loading more');
            //console.log(elem.scrollTop(), elem.prop('clientHeight'), scrollBottom,
            //elem.prop('scrollHeight') - getThreshold(), elem.prop('scrollHeight'), getThreshold());
            scope.$eval(attr.atBottom);
          } finally {
            reloadInProgress = false;
          }
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

