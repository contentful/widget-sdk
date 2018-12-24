'use strict';

angular.module('contentful').directive('cfEndlessContainer', [
  'require',
  require => {
    const _ = require('lodash');
    return {
      restrict: 'A',

      link: function(scope, elem, attr) {
        const debouncedHandleAtBottom = _.debounce(handleAtBottom, 50);

        elem.css({
          'overflow-y': 'auto'
        });

        scope.$watch(attr.numElements, (numElements, old) => {
          if (numElements === 0 && old > 0) {
            elem.prop('scrollTop', 0);
          }
        });

        elem.on('scroll', () => {
          elem.toggleClass('scrolled', elem.scrollTop() > 0);
          debouncedHandleAtBottom();
        });

        function getThreshold() {
          const threshold = parseInt(attr.threshold, 10);
          return !isNaN(threshold) && threshold >= 0 ? threshold : 200;
        }

        function handleAtBottom() {
          if (!elem.is(':visible')) return;
          const scrollBottom = elem.scrollTop() + elem.prop('clientHeight');
          if (elem.prop('scrollHeight') - getThreshold() <= scrollBottom) {
            scope.$eval(attr.atBottom);
          }
        }
      }
    };
  }
]);
