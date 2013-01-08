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

          var scrollHandler = _.debounce(function() {
            var scrollBottom = elem.scrollTop() + elem.prop('clientHeight');
            //console.log('scrolling', scrollBottom);
            if (elem.prop('scrollHeight')-200 <= scrollBottom) {
              //console.log('loading more');
              scope.$eval(attr.atBottom);
            }
          }, 150);

          elem.scroll(scrollHandler);
        }
      };
    }
  };

});

