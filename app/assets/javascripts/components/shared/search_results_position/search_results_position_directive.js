'use strict';

angular.module('contentful').directive('searchResultsPosition', function() {
  return {
    restrict: 'C',
    template: JST['search_results_position'],
    scope: {
      paginator: '='
    },
    link: function(scope, element) {
      scope.pages = [];
      scope.$watch('paginator.numPages()', function (pages) {
        scope.pages = new Array(pages);
        _.each(scope.pages, function (v, i) { scope.pages[i] = i; });
      });
      var numberController = element.find('select').controller('ngModel');
    }
  };
});



