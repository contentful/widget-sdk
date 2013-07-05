'use strict';

angular.module('contentful').
  directive('inputAutogrow', function() {
    return {
      restrict: 'C',
      link: function(scope, element) {
        element.autosize();

        element.on('focus', function() {
          element.trigger('autosize');
        });

        scope.$on('otValueChanged', function() {
          setTimeout(function() {
            element.trigger('autosize');
          }, 100);
        });
      }
    };
  });

