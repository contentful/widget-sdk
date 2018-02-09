'use strict';

angular.module('contentful')
.factory('contextHistory', ['require', function (require) {
  var K = require('utils/kefir');
  var _ = require('lodash');

  var history = [];
  var crumbBus = K.createPropertyBus(history);

  return {
    add: add,
    set: set,
    extendCurrent: extendCurrent,
    isEmpty: isEmpty,
    pop: pop,
    purge: purge,
    getLast: function () { return _.last(history); },
    crumbs$: crumbBus.property
  };

  function extendCurrent (props) {
    var current = _.last(history);
    _.assign(current, props);
    crumbBus.set(history);
  }

  function add (crumb) {
    var old;
    var index = findIndex(crumb);
    if (index > -1) {
      old = history[index];
      history = history.slice(0, index);
    }
    crumb = _.assign({}, old, crumb);
    history.push(crumb);
    crumbBus.set(history);
  }

  function set (crumbs) {
    history = crumbs;
    crumbBus.set(history);
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
