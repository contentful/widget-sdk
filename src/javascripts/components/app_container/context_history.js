'use strict';

angular.module('contentful').factory('contextHistory', ['$injector', function ($injector) {

  var $stateParams = $injector.get('$stateParams');

  var contextHistory = [];

  return {
    addEntity: addEntity,
    isEmpty: isEmpty,

    pop: function () { return contextHistory.pop(); },
    purge: function () { contextHistory = []; },

    getAll: function () { return contextHistory; },
    getLast: function () { return _.last(contextHistory); }
  };

  function addEntity (entity) {
    if (isEmpty() || $stateParams.addToContext) {
      var index = findIndex(entity);
      if (index > -1) {
        contextHistory = contextHistory.slice(0, index);
      }
      contextHistory.push(entity);
    }
  }

  function findIndex (entity) {
    return _.findIndex(contextHistory, function (historyEntry) {
      return historyEntry.id === entity.id;
    });
  }

  function isEmpty () {
    return contextHistory.length === 0;
  }
}]);
