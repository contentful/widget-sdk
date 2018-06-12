'use strict';

angular.module('contentful').factory('navigation/closeState', ['require', require => {
  var $q = require('$q');
  var $state = require('$state');
  var $location = require('$location');
  var contextHistory = require('navigation/Breadcrumbs/History').default;
  var stateChangeHandlers = require('navigation/stateChangeHandlers');

  return closeState;

  function closeState () {
    stateChangeHandlers.setNavigationConfirmed(true);
    contextHistory.pop();

    return contextHistory.isEmpty() ? goToParent() : goToPreviousEntity();
  }

  function goToPreviousEntity () {
    // TODO This code is duplicated in `cfBreadcrumbsDirective`. Maybe
    // the context history is a better place for the shared code.
    var link = contextHistory.getLast().link;
    var state = link.state;

    // TODO The `contextHistory` should take care of setting the
    // correct state when a crumb is added.
    if ($state.includes('spaces.detail.environment')) {
      state = state.replace('spaces.detail', 'spaces.detail.environment');
    }

    return $state.go(state, link.params);
  }

  // TODO(mudit): Confirm that no where in the app is contextHistory empty
  // and remove this function
  function goToParent () {
    $location.url('/');
    return $q.when();
  }
}]);
