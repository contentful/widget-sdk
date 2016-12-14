'use strict';

/**
 * @ngdoc service
 * @name spaceTools
 * @description
 * Utility service for dealing with spaces
 */
angular.module('contentful')
.factory('spaceTools', ['require', function (require) {
  var analytics = require('analytics');
  var $state = require('$state');
  var spaceContext = require('spaceContext');
  var tokenStore = require('tokenStore');

  return {
    goTo: goTo,
    goToInitialSpace: goToInitialSpace
  };

  /**
   * @ngdoc method
   * @name spaceTools#goTo
   * @param {Client.Space} space
   * @param {boolean} doNotTrack
   * @description
   * Navigates to another space if not in the account view and provided
   * space actually differs from the previous one
   */
  function goTo (space, doNotTrack) {
    if (spaceContext.getId() === space.getId()) {
      return;
    }

    if (!doNotTrack) {
      analytics.track('space_switcher:space_switched', {
        targetSpaceId: space.getId(),
        targetSpaceName: space.data.name
      });
    }

    return $state.go('spaces.detail', {spaceId: space.getId()});
  }

  /**
   * @ngdoc method
   * @name spaceTools#goToInitialSpace
   * @description
   * Goes to the first space.
   */
  function goToInitialSpace () {
    tokenStore.getSpaces().then(function (spaceList) {
      if (spaceList[0]) {
        goTo(spaceList[0], true);
      } else {
        $state.go('spaces.new');
      }
    });
  }
}]);
