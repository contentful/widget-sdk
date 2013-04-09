(function(e){if("function"==typeof bootstrap)bootstrap("ng-time-relative",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeNgTimeRelative=e}else"undefined"!=typeof window?window.ngTimeRelative=e():global.ngTimeRelative=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
'use strict';

exports = module.exports = function(module) {
  module.directive('relative', ['$timeout', 'moment', directive]);
};

exports.directive = directive;

if (angular) {
  var mod = angular.module('timeRelative', []);
  if (moment) mod.constant('moment', moment);
  exports(mod);
}

function directive($timeout, moment) {
  return {
    restrict: 'AC',
    scope: {
      datetime: '@'
    },
    link: function(scope, element, attrs) {
      var timeout;

      scope.$watch('datetime', function(dateString) {
        $timeout.cancel(timeout);

        var date = moment(dateString);
        if (!date) return;
        var to = function() { return moment(attrs.to); };
        var withoutSuffix = 'withoutSuffix' in attrs;

        if (!attrs.title)
          element.attr('title', date.format('LLLL'));

        function updateTime() {
          element.text(date.from(to(), withoutSuffix));
        }

        function updateLater() {
          updateTime();
          timeout = $timeout(function() {
            updateLater();
          }, nextUpdateIn());
        }

        function nextUpdateIn() {
          var delta = moment().diff(date);
          if (delta < 45e3) return 45e3 - delta;
          if (delta < 90e3) return 90e3 - delta;
          if (delta < 45 * 60e3) return 60e3 - (delta + 30e3) % 60e3;
          return 3660e3 - delta % 3600e3;
        }

        element.bind('destroy', function() {
          $timeout.cancel(timeout);
        });

        updateLater();
      });
    }
  };
}

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc3RlcGhhbi9Db2RlL25nLXRpbWUtcmVsYXRpdmUvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3JlbGF0aXZlJywgWyckdGltZW91dCcsICdtb21lbnQnLCBkaXJlY3RpdmVdKTtcbn07XG5cbmV4cG9ydHMuZGlyZWN0aXZlID0gZGlyZWN0aXZlO1xuXG5pZiAoYW5ndWxhcikge1xuICB2YXIgbW9kID0gYW5ndWxhci5tb2R1bGUoJ3RpbWVSZWxhdGl2ZScsIFtdKTtcbiAgaWYgKG1vbWVudCkgbW9kLmNvbnN0YW50KCdtb21lbnQnLCBtb21lbnQpO1xuICBleHBvcnRzKG1vZCk7XG59XG5cbmZ1bmN0aW9uIGRpcmVjdGl2ZSgkdGltZW91dCwgbW9tZW50KSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBQycsXG4gICAgc2NvcGU6IHtcbiAgICAgIGRhdGV0aW1lOiAnQCdcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIHRpbWVvdXQ7XG5cbiAgICAgIHNjb3BlLiR3YXRjaCgnZGF0ZXRpbWUnLCBmdW5jdGlvbihkYXRlU3RyaW5nKSB7XG4gICAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgICAgICB2YXIgZGF0ZSA9IG1vbWVudChkYXRlU3RyaW5nKTtcbiAgICAgICAgaWYgKCFkYXRlKSByZXR1cm47XG4gICAgICAgIHZhciB0byA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbW9tZW50KGF0dHJzLnRvKTsgfTtcbiAgICAgICAgdmFyIHdpdGhvdXRTdWZmaXggPSAnd2l0aG91dFN1ZmZpeCcgaW4gYXR0cnM7XG5cbiAgICAgICAgaWYgKCFhdHRycy50aXRsZSlcbiAgICAgICAgICBlbGVtZW50LmF0dHIoJ3RpdGxlJywgZGF0ZS5mb3JtYXQoJ0xMTEwnKSk7XG5cbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlVGltZSgpIHtcbiAgICAgICAgICBlbGVtZW50LnRleHQoZGF0ZS5mcm9tKHRvKCksIHdpdGhvdXRTdWZmaXgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZUxhdGVyKCkge1xuICAgICAgICAgIHVwZGF0ZVRpbWUoKTtcbiAgICAgICAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB1cGRhdGVMYXRlcigpO1xuICAgICAgICAgIH0sIG5leHRVcGRhdGVJbigpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG5leHRVcGRhdGVJbigpIHtcbiAgICAgICAgICB2YXIgZGVsdGEgPSBtb21lbnQoKS5kaWZmKGRhdGUpO1xuICAgICAgICAgIGlmIChkZWx0YSA8IDQ1ZTMpIHJldHVybiA0NWUzIC0gZGVsdGE7XG4gICAgICAgICAgaWYgKGRlbHRhIDwgOTBlMykgcmV0dXJuIDkwZTMgLSBkZWx0YTtcbiAgICAgICAgICBpZiAoZGVsdGEgPCA0NSAqIDYwZTMpIHJldHVybiA2MGUzIC0gKGRlbHRhICsgMzBlMykgJSA2MGUzO1xuICAgICAgICAgIHJldHVybiAzNjYwZTMgLSBkZWx0YSAlIDM2MDBlMztcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQuYmluZCgnZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdXBkYXRlTGF0ZXIoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==(1)
});
;