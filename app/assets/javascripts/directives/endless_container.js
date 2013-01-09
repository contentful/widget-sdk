define([
  'lodash'
], function(_){
  'use strict';

  return {
    name: 'endlessContainer',
    factory: function(){
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

          scope.$on('$destroy', function() {
            clearInterval(interval);
            interval = 0;
          });

        }
      };
    }
  };

});

