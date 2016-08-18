'use strict';

angular.module('contentful').factory('navigation/closeState', ['$injector', function ($injector) {

  var $q = $injector.get('$q');
  var $state = $injector.get('$state');
  var $location = $injector.get('$location');
  var contextHistory = $injector.get('contextHistory');
  var stateChangeHandlers = $injector.get('navigation/stateChangeHandlers');

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
