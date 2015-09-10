'use strict';

angular.module('contentful').factory('spaceTools', ['$injector', function($injector) {

  var TheStore       = $injector.get('TheStore');
  var TheAccountView = $injector.get('TheAccountView');
  var analytics      = $injector.get('analytics');
  var $state         = $injector.get('$state');
  var spaceContext   = $injector.get('spaceContext');

  return {
    getLastUsed:  getLastUsed,
    getFromList:  getFromList,
    goTo:         goTo
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
}]);
