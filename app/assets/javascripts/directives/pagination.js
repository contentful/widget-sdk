'use strict';

angular.module('contentful/directives').directive('pagination', function(){
  return {
    template: JST.pagination(),
    restrict: 'E',
    scope: {
      paginator: '=',
      //smallThreshold: '=small',
      //largeThreshold: '=large'
    },
    link: function(scope){
      scope.smallThreshold = 0;
      scope.largeThreshold = 0;

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
});
