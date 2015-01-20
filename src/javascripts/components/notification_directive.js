'use strict';

angular.module('contentful').
  directive('notification', ['$timeout', function($timeout) {
    var durationAfterSeen = 3e3;
    // if message is longer than this, extend duration
    var messageLengthModifier = 100;

    return {
      restrict: 'C',
      link: function(scope, element) {
        var timeout;

        element.bind('click', function(ev) {
          ev.stopPropagation();
          scope.$apply(function(scope) {
            scope.message.seen = true;
          });
        });

        element.bind('mouseover', function() {
          $timeout.cancel(timeout);
        });

        element.bind('mouseout', function() {
          markSeenAfterDelay();
        });

        function markSeenAfterDelay() {
          $timeout.cancel(timeout);
          var durationModifier = Math.ceil(scope.message.body.length / messageLengthModifier);
          var duration = durationAfterSeen * durationModifier;
          timeout = $timeout(function() {
            scope.message.seen = true;
          }, duration);
        }

        markSeenAfterDelay();
      }
    };
  }]);
