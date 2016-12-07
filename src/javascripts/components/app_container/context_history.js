'use strict';

angular.module('contentful')
.factory('contextHistory', ['require', function (require) {
  var $stateParams = require('$stateParams');

  var contextHistory = [];

  return {
    add: add,
    isEmpty: isEmpty,

    pop: function () { return contextHistory.pop(); },
    purge: function () { contextHistory = []; },

    getAll: function () { return contextHistory; },
    getLast: function () { return _.last(contextHistory); }
  };

  function add (crumb) {
    if (isEmpty() || $stateParams.addToContext) {
      var index = findIndex(crumb);
      if (index > -1) {
        contextHistory = contextHistory.slice(0, index);
      }
      contextHistory.push(crumb);
    }
  }

  function findIndex (crumb) {
    return _.findIndex(contextHistory, function (historyCrumb) {
      return historyCrumb.id === crumb.id;
    });
  }

  function isEmpty () {
    return contextHistory.length === 0;
  }
}]);
