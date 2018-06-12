'use strict';

angular.module('contentful').directive('cfEndlessContainer', () => ({
  restrict: 'A',

  link: function (scope, elem, attr) {
    var debouncedHandleAtBottom = _.debounce(handleAtBottom, 50);

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

    function getThreshold () {
      var threshold = parseInt(attr.threshold, 10);
      return !isNaN(threshold) && threshold >= 0 ? threshold : 200;
    }

    function handleAtBottom () {
      if (!elem.is(':visible')) return;
      var scrollBottom = elem.scrollTop() + elem.prop('clientHeight');
      if (elem.prop('scrollHeight') - getThreshold() <= scrollBottom) {
        scope.$eval(attr.atBottom);
      }
    }
  }
}));
