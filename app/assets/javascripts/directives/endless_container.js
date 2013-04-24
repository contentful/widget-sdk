'use strict';

angular.module('contentful/directives').directive('endlessContainer', function(){
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      elem.css({
        'overflow-y': 'auto'
      });

      var reloadInProgress;

      var interval = setInterval(function() {
        if (!elem.is(':visible')) return;
        var scrollBottom = elem.scrollTop() + elem.prop('clientHeight');
        //console.log('scrolling', scrollBottom);
        if (elem.prop('scrollHeight')-200 <= scrollBottom) {
          reloadInProgress = true;
          try {
            //console.log('loading more');
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
        elem.toggleClass('scrolled', elem.scrollTop() > 0)
      });
    }
  };
});

