'use strict';

angular.module('cf.app')

.factory('Paginator', [function () {
  var DEFAULT_PER_PAGE = 40;

  return {create: create};

  function create (perPage) {
    var page = 0;
    var total = 0;
    perPage = perPage || DEFAULT_PER_PAGE;

    return {
      total: function (newTotal) {
        total = updatedValue(newTotal, total);
        return total;
      },
      page: function (newPage) {
        page = updatedValue(newPage, page);
        return page;
      },
      next: function () {
        return this.page(step(+1));
      },
      previous: function () {
        return this.page(step(-1));
      },
      perPage: function () {
        return perPage;
      },
      skipParam: function () {
        return page * perPage;
      },
      pageCount: function () {
        return Math.ceil(total / perPage);
      },
      end: function () {
        return page >= this.pageCount() - 1;
      }
    };
  }

  function updatedValue (next, current) {
    if (_.isNumber(next)) {
      return next;
    } else if (_.isFunction(next)) {
      return next(current);
    } else {
      return current;
    }
  }

  function step (change) {
    return function (current) {
      return current + change;
    };
  }
}]);
