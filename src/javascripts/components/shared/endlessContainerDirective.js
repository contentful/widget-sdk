import { registerDirective } from 'core/NgRegistry';
import _ from 'lodash';

export default function register() {
  registerDirective('cfEndlessContainer', () => ({
    restrict: 'A',

    link: function (scope, elem, attr) {
      const debouncedHandleAtBottom = _.debounce(handleAtBottom, 50);

      elem.css({
        'overflow-y': 'auto',
      });

      scope.$watch(attr.numElements, (numElements, old) => {
        if (numElements === 0 && old > 0) {
          elem.prop('scrollTop', 0);
        }
      });

      elem.on('scroll', () => {
        elem.toggleClass('scrolled', elem.prop('scrollTop', 0) > 0);
        debouncedHandleAtBottom();
      });

      function getThreshold() {
        const threshold = parseInt(attr.threshold, 10);
        return !isNaN(threshold) && threshold >= 0 ? threshold : 200;
      }

      function handleAtBottom() {
        if (!elem[0].matches(':visible')) return;
        const scrollBottom = elem.prop('scrollTop', 0) + elem.prop('clientHeight');
        if (elem.prop('scrollHeight') - getThreshold() <= scrollBottom) {
          scope.$eval(attr.atBottom);
        }
      }
    },
  }));
}
