'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @name Paginator
 * @module cf.app
 *
 * @description
 * This service can be used to hold the state
 * of list pagination. It doesn't store any data,
 * it only keeps track of counts and exposes
 * modifier and getter functions.
 *
 * @usage[js]
 * // Constructor accepts only one parameter
 * // (page length). The default is 40.
 * var paginator = Paginator.create(35);
 *
 * paginator.setTotal(37);
 * paginator.getPageCount(); // => 2
 * paginator.isAtLast(); // => false
 * paginator.next();
 * paginator.isAtLast(); // => true
 *
 * // Setters accept both value and function:
 * paginator.setPage(2);
 * paginator.getPage(); // => 2
 * paginator.setPage(function (currentPage) {
 *   return currentPage + 2;
 * });
 * paginator.getPage(); // => 4
 */
.factory('Paginator', [function () {
  var DEFAULT_PER_PAGE = 40;

  return {create: create};

  function create (perPage) {
    var page = 0;
    var total = 0;
    perPage = perPage || DEFAULT_PER_PAGE;

    return {
      /**
       * @ngdoc method
       * @name Paginator#setTotal
       * @description
       * Sets total number of collection items.
       */
      setTotal: function (newTotal) {
        total = updateValue(newTotal, total);
      },
      /**
       * @ngdoc method
       * @name Paginator#getTotal
       * @returns {number}
       * @description
       * Gets total number of collection items
       */
      getTotal: function () {
        return total;
      },
      /**
       * @ngdoc method
       * @name Paginator#setPage
       * @description
       * Sets the current page.
       */
      setPage: function (newPage) {
        page = updateValue(newPage, page);
      },
      /**
       * @ngdoc method
       * @name Paginator#getPage
       * @returns {number}
       * @description
       * Gets the current page.
       */
      getPage: function () {
        return page;
      },
      /**
       * @ngdoc method
       * @name Paginator#next
       * @description
       * Increases the current page number.
       */
      next: function () {
        page += 1;
      },
      /**
       * @ngdoc method
       * @name Paginator#prev
       * @description
       * Decreases the current page number.
       */
      prev: function () {
        page -= 1;
      },
      /**
       * @ngdoc method
       * @name Paginator#getPerPage
       * @returns {number}
       * @description
       * Gets number of items per page.
       */
      getPerPage: function () {
        return perPage;
      },
      /**
       * @ngdoc method
       * @name Paginator#getSkipParam
       * @returns {number}
       * @description
       * Gets "skip" param that should be used
       * to query the current page.
       */
      getSkipParam: function () {
        return page * perPage;
      },
      /**
       * @ngdoc method
       * @name Paginator#getPageCount
       * @returns {number}
       * @description
       * Gets number of pages.
       */
      getPageCount: function () {
        return Math.ceil(total / perPage);
      },
      /**
       * @ngdoc method
       * @name Paginator#isAtLast
       * @returns {boolean}
       * @description
       * Returns true if the current page
       * is the last one.
       */
      isAtLast: function () {
        return page >= this.getPageCount() - 1;
      }
    };
  }

  function updateValue (next, current) {
    if (_.isNumber(next)) {
      return next;
    } else if (_.isFunction(next)) {
      return next(current);
    } else {
      return current;
    }
  }
}]);
