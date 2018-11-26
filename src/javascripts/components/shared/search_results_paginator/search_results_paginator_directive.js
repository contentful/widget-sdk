'use strict';

/*
 * @ngdoc directive
 * @name cfSearchResultsPaginator
 * @description
 * This directive will add pagination controls to the DOM.
 * It needs an instance of Paginator service as input and
 * optionally, the number of page numbers shown.
 * Since the idea is to have the "current page" centered amongst
 * neighbouring page numbers, choose an odd value great than 5 for
 * the `pages` attribute. When this attribute is not provided it
 * defaults to 5.
 *
 * TODO This directive is deprecated. Use `ui/Components/Paginator`
 * instead.
 *
 * @usage[jade]
 * div
 *   header
 *   cf-search-results-paginator(paginator="paginatorInstance")
 *   cf-search-results-paginator(paginator="paginatorInstance" pages="7")
 *
 */
angular.module('contentful').directive('cfSearchResultsPaginator', [
  () => ({
    restrict: 'E',
    template: JST['search_results_paginator'](),

    scope: {
      paginator: '=',
      getNoOfPages: '&pages'
    },

    link: function(scope) {
      let SET_LENGTH = scope.getNoOfPages();

      /*
       * no of shown pages should be atleast 5
       * to accomodate first, current, one before, one after
       * and last page numbers
       */
      SET_LENGTH = SET_LENGTH > 5 ? SET_LENGTH : 5;

      /*
       * This is the number of pages we show before and after
       * the current page
       * We subtract two from SET_LENGTH to compensate for
       * the always present 1st and last pages.
       * The remaining, we divide by 2.
       * For example, for a SET_LENGTH of 7, we must show
       * the first page, 2 before current page, current page,
       * 2 after current page and last page (total 7).
       * The 2 before and after, or the DELTA is floor(2.5) = 2
       */
      const DELTA = Math.floor((SET_LENGTH - 2) / 2);

      // prepare options for the select
      scope.$watch(scope.paginator.getPageCount, updateLabels);

      // handle external changes
      scope.$watch(scope.paginator.getPage, updateLabels);

      // init internal model
      updateLabels();

      /*
       * To see how this works, lets assume the following:
       * pageCount = 10, activePage = 1, DELTA = 2, SET_LENGTH = 7, mid = 5
       *
       * It first builds a list [1, -1, 0, 1, 2, 3, 10]
       * then filters and sorts it down to [1, 2, 3, 10]
       * Since length of this set is less than SET_LENGTH it bumps the page
       * by one (above or below based on mid), and grows the result set
       * till it has SET_LENGTH elements
       * So, the recursive calls look like:
       * getRange (10, 2) => [1, 2, 3, 4, 10]
       * getRange (10, 3) => [1, 2, 3, 4, 5, 10]
       * getRange (10, 4) => [1, 2, 3, 4, 5, 6, 10] <- this is returned
       */
      function getRange(pageCount, activePage) {
        if (pageCount <= SET_LENGTH) {
          return _.range(1, pageCount + 1);
        } else {
          const mid = Math.ceil(pageCount / 2);
          const range = _([1])
            .concat(_.range(activePage - DELTA, activePage + DELTA + 1))
            .concat(pageCount)
            .filter(v => v > 0 && v <= pageCount)
            .sortedUniq()
            .value();

          if (range.length < SET_LENGTH) {
            return activePage <= mid
              ? getRange(pageCount, activePage + 1)
              : getRange(pageCount, activePage - 1);
          } else {
            return range;
          }
        }
      }

      function getLabels(list) {
        const DOTS = '…';

        if (list.length === SET_LENGTH) {
          if (list[SET_LENGTH - 1] - list[SET_LENGTH - 2] !== 1) {
            list.splice(SET_LENGTH - 1, 0, DOTS);
          }
          if (list[1] - list[0] !== 1) {
            list.splice(1, 0, DOTS);
          }
        }

        return list.map(l => ({
          text: l.toString(),
          value: l === DOTS ? null : l - 1
        }));
      }

      function updateLabels() {
        const pageCount = scope.paginator.getPageCount();
        // pages are 0 indexed while page numbers shown are 1-indexed
        const page = scope.paginator.getPage() + 1;

        scope.labels = getLabels(getRange(pageCount, page));
      }
    }
  })
]);
