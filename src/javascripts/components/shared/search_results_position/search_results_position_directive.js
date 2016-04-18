'use strict';

angular.module('contentful').directive('cfSearchResultsPosition', [function () {
  return {
    restrict: 'A',
    template: JST['search_results_position'](),
    scope: {paginator: '='},
    link: function (scope) {
      // prepare options for the select
      scope.$watch('paginator.numPages()', function (pages) {
        scope.pages = _.range(pages);
        updateInternalModel();
      });

      // handle external changes
      scope.$watch('paginator.page', updateInternalModel);

      // do not set non-numerical values back on the real paginator
      scope.$watch('page', function (page) {
        if (_.isNumber(page)) { scope.paginator.page = page; }
      });

      // use intermediate property as a model of the select
      function updateInternalModel () {
        scope.page = scope.paginator.page;
      }
    }
  };
}]);
