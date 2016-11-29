'use strict';

angular.module('contentful').directive('cfSearchResultsPaginator', [function () {
  var SET_LENGTH = 7;

  return {
    restrict: 'E',
    template: JST['search_results_paginator'](),
    scope: {paginator: '='},
    link: function (scope) {
      scope.setPage = setPage;

      // prepare options for the select
      scope.$watch('paginator.getPageCount()', updateInternalModel);

      // handle external changes
      scope.$watch('paginator.getPage()', updateInternalModel);

      // init internal model
      updateInternalModel();

      function setPage (page) {
        if (_.isNumber(page) && page >= 0) {
          scope.paginator.setPage(page);
          updateInternalModel();
        }
      }

      function getRange (pageCount, activePage) {
        if (pageCount <= SET_LENGTH) {
          return _.range(1, pageCount + 1);
        } else {
          var mid = Math.ceil(pageCount / 2);
          var range = _.concat([1], _.range(activePage - 2, activePage + 3), pageCount);

          range = _(range)
            .filter(function (v) {
              return v > 0 && v <= pageCount;
            })
            .sortedUniq()
            .value();

          if (range.length < SET_LENGTH) {
            return activePage <= mid ? getRange(pageCount, activePage + 1) : getRange(pageCount, activePage - 1);
          } else {
            return range;
          }
        }
      }

      function getLabels (list) {
        if (list.length === SET_LENGTH) {
          if (list[SET_LENGTH - 1] - list[SET_LENGTH - 2] !== 1) {
            list.splice(SET_LENGTH - 1, 0, '...');
          }
          if (list[1] - list[0] !== 1) {
            list.splice(1, 0, '...');
          }
        }

        return list.map(function (l) {
          return {
            text: l.toString(),
            value: l === '...' ? null : l - 1
          };
        });
      }

      // use intermediate property as a model of the select
      function updateInternalModel () {
        scope.page = scope.paginator.getPage();
        scope.pageCount = scope.paginator.getPageCount();
        scope.onFirstPage = scope.page === 0;
        scope.onLastPage = scope.page + 1 === scope.pageCount;
        scope.labels = getLabels(getRange(scope.pageCount, scope.page + 1));
      }
    }
  };
}]);
