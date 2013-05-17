'use strict';

angular.module('contentful').directive('searchResultsPosition', function() {
  return {
    restrict: 'C',
    template: JST['search_results_position'],
    scope: {
      paginator: '='
    },
    link: function(scope, element) {
      var paginatorTipTop = function(progress) {
        progress = Math.min(Math.max(progress, 0.2), 0.8);
        return Math.floor(progress * 100) + '%';
      };

      scope.$watch('paginator.progress()', function(progress) {
        element.find('.fill').css({height: progress*100+'%'});
        element.find('.tip').css({top: paginatorTipTop(progress)});
      });
    }
  };
});


