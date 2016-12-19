'use strict';

angular.module('contentful')
.factory('contextHistory', ['require', function (require) {
  var K = require('utils/kefir');
  var $stateParams = require('$stateParams');

  var history = [];
  var crumbBus = K.createPropertyBus(history);

  return {
    add: add,
    isEmpty: isEmpty,
    pop: pop,
    purge: purge,
    getLast: function () { return _.last(history); },
    crumbs$: crumbBus.property
  };

  function add (crumb) {
    // TODO: make it an argument
    var shouldAdd = $stateParams.addToContext;

    if (isEmpty() || shouldAdd) {
      var index = findIndex(crumb);
      if (index > -1) {
        history = history.slice(0, index);
      }
      history.push(crumb);
      crumbBus.set(history);
    }
  }

  function findIndex (crumb) {
    return _.findIndex(history, function (historyCrumb) {
      return historyCrumb.id === crumb.id;
    });
  }

  function isEmpty () {
    return history.length === 0;
  }

  function pop () {
    var popped = history.pop();
    crumbBus.set(history);
    return popped;
  }

  function purge () {
    history = [];
    crumbBus.set(history);
  }
}]);
