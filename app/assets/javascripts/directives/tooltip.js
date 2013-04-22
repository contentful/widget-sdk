'use strict';

angular.module('contentful/directives').
  directive('title', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        $(element).tooltip({
          delay: {show: 100, hide: 100}
        });

        scope.$watch(attr.ngDisabled, function(disabled) {
          if (disabled) $(element).tooltip('hide');
        });
      }
    };
  });
