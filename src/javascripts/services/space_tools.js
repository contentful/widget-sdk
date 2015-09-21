'use strict';

angular.module('contentful').factory('spaceTools', ['$injector', function($injector) {

  var TheStore       = $injector.get('TheStore');
  var TheAccountView = $injector.get('TheAccountView');
  var analytics      = $injector.get('analytics');
  var $state         = $injector.get('$state');
  var spaceContext   = $injector.get('spaceContext');
  var tokenStore     = $injector.get('tokenStore');
  var notification   = $injector.get('notification');

  return {
    getLastUsed:      getLastUsed,
    getFromList:      getFromList,
    goTo:             goTo,
    goToInitialSpace: goToInitialSpace
  };

  function getLastUsed() {
    return TheStore.get('lastUsedSpace');
  }

  function getFromList(id, spaceList) {
    return _.find(spaceList, function (space) {
      return space.getId() === id;
    });
  }

  function goTo(space, doNotTrack) {
    if (!TheAccountView.isActive() && spaceContext.getId() === space.getId()) {
      return;
    }
    if (!doNotTrack) {
      analytics.track('Switched Space', {
        spaceId: space.getId(),
        spaceName: space.data.name
      });
    }
    TheStore.set('lastUsedSpace', space.getId());
    $state.go('spaces.detail', { spaceId: space.getId() });
  }

  function goToInitialSpace(forcedId) {
    tokenStore.getSpaces().then(function (spaceList) {
      var space = determineInitialSpace(spaceList, forcedId);

      if (space) {
        goTo(space, true);
      } else {
        $state.go('spaces.new');
      }
    });
  }

  function determineInitialSpace(spaceList, forcedId) {
    var space = getFromList(forcedId || getLastUsed(), spaceList);

    if (_.isObject(space) && _.isFunction(space.getId)) {
      return space;
    }

    if (forcedId) {
      notification.warn('Space does not exist or is inaccessible');
    }

    return spaceList[0];
  }
}]);
