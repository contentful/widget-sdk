define(function(){
  'use strict';

  return {
    name: 'dateFrom',
    factory: function() {
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
    }
  };

});

