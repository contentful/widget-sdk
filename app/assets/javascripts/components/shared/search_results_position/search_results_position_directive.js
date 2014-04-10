'use strict';

angular.module('contentful').directive('searchResultsPosition', function() {
  return {
    restrict: 'C',
    template: JST['search_results_position'],
    scope: {
      paginator: '='
    },
    link: function(scope, element) {
      scope.$watch('paginator.progress()', function(progress) {
        element.find('.fill').css({height: progress*100+'%'});
      });
    }
  };
});


