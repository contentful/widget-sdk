'use strict';

angular.module('cf.ui')
.directive('uiHighlightMatch', ['require', require => {
  var document = require('$document').get(0);
  return {
    restrict: 'A',
    scope: {
      baseString: '=uiHighlightMatch',
      search: '=search'
    },
    link: function ($scope, $el) {
      $scope.$watchGroup(['baseString', 'search'], values => {
        var base = values[0] || '';
        var search = values[1] || '';
        var start = base.toLowerCase().indexOf(search.toLowerCase());
        if (start > -1) {
          var end = start + search.length;
          var prefix = base.substring(0, start);
          var match = base.substring(start, end);
          var suffix = base.substring(end);

          var strong = document.createElement('strong');
          strong.textContent = match;

          $el.empty().append([
            document.createTextNode(prefix),
            strong,
            document.createTextNode(suffix)
          ]);
        } else {
          $el.text(base);
        }
      });
    }
  };
}]);
