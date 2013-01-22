/*global moment:false*/

'use strict';

angular.module('contentful/directives').directive('dateFrom', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      scope.$watch(attr.dateFrom, function watchWithFilter(value) {
        if (value) {
          var m = moment(value);
          element.attr('title', m.format('LLLL'));
          element.text(m.fromNow());
        } else {
          element.text('');
          element.attr('title', '');
        }
      });
    }
  };
});

