'use strict';

angular.module('contentful/directives').
  directive('title', function() {
    return {
      restrict: 'A',
      link: function(scope, element) {
        $(element).tooltip();
      }
    };
  });
