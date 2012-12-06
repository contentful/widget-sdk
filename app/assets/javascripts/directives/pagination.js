define([
  'angular',
  'templates/pagination'
], function(angular, paginationTemplate){
  'use strict';

  return {
    name: 'pagination',
    factory: function(){
      return {
        template: paginationTemplate(),
        restrict: 'E',
        scope: {
          paginator: '=',
          //smallThreshold: '=small',
          //largeThreshold: '=large'
        },
        link: function(scope){
          scope.smallThreshold = 10;
          scope.largeThreshold = 30;

          scope.size = function (){
            if (scope.paginator.numPages() <= scope.smallThreshold) {
              return 'small';
            } else if (scope.paginator.numPages() <= scope.largeThreshold){
              return 'medium';
            } else {
              return 'large';
            }
          };

        }
      };
    }
  };

});

