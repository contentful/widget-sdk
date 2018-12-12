'use strict';

angular.module('cf.ui').directive('uiHighlightMatch', [
  'require',
  require => {
    const document = require('$document').get(0);
    return {
      restrict: 'A',
      scope: {
        baseString: '=uiHighlightMatch',
        search: '=search'
      },
      link: function($scope, $el) {
        $scope.$watchGroup(['baseString', 'search'], values => {
          const base = values[0] || '';
          const search = values[1] || '';
          const start = base.toLowerCase().indexOf(search.toLowerCase());
          if (start > -1) {
            const end = start + search.length;
            const prefix = base.substring(0, start);
            const match = base.substring(start, end);
            const suffix = base.substring(end);

            const strong = document.createElement('strong');
            strong.textContent = match;

            $el
              .empty()
              .append([document.createTextNode(prefix), strong, document.createTextNode(suffix)]);
          } else {
            $el.text(base);
          }
        });
      }
    };
  }
]);
