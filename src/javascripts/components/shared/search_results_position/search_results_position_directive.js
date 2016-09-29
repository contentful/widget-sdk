'use strict';

angular.module('contentful').directive('cfSearchResultsPosition', [function () {
  return {
    restrict: 'A',
    template: JST['search_results_position'](),
    scope: {paginator: '='},
    link: function (scope) {
      // prepare options for the select
      scope.$watch('paginator.getPageCount()', function (pageCount) {
        scope.pages = _.range(pageCount);
        updateInternalModel();
      });

      // handle external changes
      scope.$watch('paginator.getPage()', updateInternalModel);

      // do not set non-numerical values back on the real paginator
      scope.$watch('page', function (page) {
        if (_.isNumber(page)) {
          scope.paginator.setPage(page);
        }
      });

      // use intermediate property as a model of the select
      function updateInternalModel () {
        scope.page = scope.paginator.getPage();
      }
    }
  };
}]);
