'use strict';

/**
 * @ngdoc directive
 * @name relative
 * @usage[html]
 * <date datetime="2015-01-01" cf-relative-datetime></date>
 * @description
 * Replace the content of the element with a string indicating the time
 * relative to now.
 *
 * Uses the `moment.calendar()` function to generate the relative.
 * time
 *
 * @todo Move this into UI module
 */
angular.module('contentful')
.directive('cfRelativeDatetime', ['require', require => {
  const $timeout = require('$timeout');
  const moment   = require('moment');

  return {
    restrict: 'A',
    scope: {
      datetime: '@'
    },
    link: function(scope, element, attrs) {
      let timeout;

      scope.$watch('datetime', dateString => {
        $timeout.cancel(timeout);

        const date = moment(dateString);
        if (!date || !date.isValid()) throw new Error('Invalid date');

        const to = () => moment(attrs.to);
        const withoutSuffix = 'withoutSuffix' in attrs;

        if (!attrs.title)
          element.attr('title', date.format('LLLL'));

        element.bind('$destroy', () => {
          $timeout.cancel(timeout);
        });

        updateLater();

        function updateTime() {
          element.text(diffString(date, to()));
        }

        function diffString(a, b) {
          if (Math.abs(a.clone().startOf('day').diff(b, 'days', true)) < 1)
            return a.from(b, withoutSuffix);
          else
            return a.calendar(b);
        }

        function updateLater() {
          updateTime();
          timeout = $timeout(() => {
            updateLater();
          }, nextUpdateIn());
        }

        function nextUpdateIn() {
          const delta = Math.abs(moment().diff(date));
          if (delta < 45e3) return 45e3 - delta;
          if (delta < 90e3) return 90e3 - delta;
          if (delta < 45 * 60e3) return 60e3 - (delta + 30e3) % 60e3;
          return 3660e3 - delta % 3600e3;
        }
      });
    }
  };
}]);
