'use strict';

angular.module('contentful').factory('navigation/closeState', ['$injector', function ($injector) {

  var $q                  = $injector.get('$q');
  var $state              = $injector.get('$state');
  var $location           = $injector.get('$location');
  var contextHistory      = $injector.get('contextHistory');
  var stateChangeHandlers = $injector.get('navigation/stateChangeHandlers');

  return closeState;

  function closeState() {
    stateChangeHandlers.setNavigationConfirmed(true);
    contextHistory.pop();

    return contextHistory.isEmpty() ? goToParent() : goToPreviousEntity();
  }

  function goToPreviousEntity() {
    var entity = contextHistory.getLast();

    if (entity.getType() === 'Entry') {
      return $state.go('spaces.detail.entries.detail', {
        entryId: entity.getId(), addToContext: true
      });
    } else if (entity.getType() === 'Asset') {
      return $state.go('spaces.detail.assets.detail', {
        assetId: entity.getId(), addToContext: true
      });
    }

    return $q.when();
  }

  function goToParent() {
    var currentState = $state.$current;
    var parent = currentState.ncyBreadcrumb && currentState.ncyBreadcrumb.parent;

    if (parent) {
      return $state.go(parent);
    } else {
      $location.url('/');
      return $q.when();
    }
  }
}]);
