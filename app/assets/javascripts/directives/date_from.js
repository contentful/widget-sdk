'use strict';

angular.module('contentful/directives').directive('dateFrom', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      scope.$watch(attr.dateFrom, function watchWithFilter(value) {
        if (value) {
          element.text(new Date(value).toLocaleString('de'));
        } else {
          element.text('');
        }
      });
    }
  };
});

