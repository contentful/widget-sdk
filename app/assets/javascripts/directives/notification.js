'use strict';

angular.module('contentful/directives').
  directive('wat', function($timeout) {
    var durationAfterSeen = 3e3;

    return {
      restrict: 'C',
      link: function(scope, element) {
        var timeout;

        element.bind('click', function() {
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
          timeout = $timeout(function() {
            scope.message.seen = true;
          }, durationAfterSeen);
        }

        markSeenAfterDelay();
      }
    };
  });
