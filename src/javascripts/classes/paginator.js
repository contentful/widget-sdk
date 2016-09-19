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
      setTotal: function (newTotal) {
        total = updateValue(newTotal, total);
      },
      getTotal: function () {
        return total;
      },
      setPage: function (newPage) {
        page = updateValue(newPage, page);
      },
      getPage: function () {
        return page;
      },
      next: function () {
        page += 1;
      },
      prev: function () {
        page -= 1;
      },
      getPerPage: function () {
        return perPage;
      },
      getSkipParam: function () {
        return page * perPage;
      },
      getPageCount: function () {
        return Math.ceil(total / perPage);
      },
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
