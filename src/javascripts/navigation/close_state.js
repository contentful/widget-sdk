'use strict';

angular.module('contentful').factory('navigation/closeState', ['require', function (require) {

  var $q = require('$q');
  var $state = require('$state');
  var $location = require('$location');
  var contextHistory = require('contextHistory');
  var stateChangeHandlers = require('navigation/stateChangeHandlers');

  return closeState;

  function closeState () {
    stateChangeHandlers.setNavigationConfirmed(true);
    contextHistory.pop();

    return contextHistory.isEmpty() ? goToParent() : goToPreviousEntity();
  }

  function goToPreviousEntity () {
    var entity = contextHistory.getLast();

    return $state.go(entity.link.state, entity.link.params);
  }

  // TODO(mudit): Confirm that no where in the app is contextHistory empty
  // and remove this function
  function goToParent () {
    $location.url('/');
    return $q.when();
  }
}]);
