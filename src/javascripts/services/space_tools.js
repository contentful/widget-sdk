'use strict';

/**
 * @ngdoc service
 * @name spaceTools
 * @description
 * Utility service for dealing with spaces
 */
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

  /**
   * @ngdoc method
   * @name spaceTools#getLastUsed
   * @returns {string}
   * @description
   * Returns ID of last used space
   */
  function getLastUsed() {
    return TheStore.get('lastUsedSpace');
  }

  /**
   * @ngdoc method
   * @name spaceTools#getFromList
   * @param {string} id
   * @param {Client.Space[]} spaceList
   * @returns {Client.Space}
   * @description
   * Given ID and list of spaces, returns space with provided ID
   */
  function getFromList(id, spaceList) {
    return _.find(spaceList, function (space) {
      return space.getId() === id;
    });
  }


  /**
   * @ngdoc method
   * @name spaceTools#goTo
   * @param {Client.Space} space
   * @param {boolean} doNotTrack
   * @description
   * Navigates to another space if not in the account view and provided
   * space actually differs from the previous one; stores ID (for "getLastUsed")
   */
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

  /**
   * @ngdoc method
   * @name spaceTools#goToInitialSpace
   * @param {string} forcedId
   * @description
   * Determines initial space and navigates there.
   * Navigates to new space view if there are no spaces at all.
   */
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
