'use strict';

/**
 * @ngdoc service
 * @name sectionAccess
 *
 * @description
 * This service makes use of accessChecker's section visibility data to expose
 * utility methods for checking access and redirecting to sections (top menu).
 */
angular.module('contentful')
.factory('sectionAccess', ['require', function (require) {
  var accessChecker = require('accessChecker');
  var $state = require('$state');
  var $stateParams = require('$stateParams');
  var spaceContext = require('spaceContext');

  var BASE_STATE = 'spaces.detail';

  var SECTION_ACCESS_ORDER = [
    ['entry', 'entries.list'],
    ['contentType', 'content_types.list'],
    ['asset', 'assets.list'],
    ['apiKey', 'api.home'],
    ['settings', 'settings.users.list']
  ];

  return {
    hasAccessToAny: hasAccessToAny,
    redirectToFirstAccessible: redirectToFirstAccessible
  };

  /**
   * @ngdoc method
   * @name sectionAccess#hasAccessToAny
   * @description
   * Returns true if user has access to at least one section, false otherwise.
   */
  function hasAccessToAny () {
    return _.isString(getFirstAccessibleSection());
  }

  function getFirstAccessibleSection () {
    var visibility = accessChecker.getSectionVisibility();
    var section = _.find(SECTION_ACCESS_ORDER, function (section) {
      return visibility[section[0]];
    });

    return _.isArray(section) ? section[1] : null;
  }

  /**
   * @ngdoc method
   * @name sectionAccess#redirectToFirstAccessible
   * @description
   * This method is intended to be used in `spaces.detail` pseudo-state.
   * It'll iterate through sections in order of preference, pick the first
   * accessible one and redirect there.
   *
   * We check current state because `spaces.detail` controller
   * is instantiated for child states, too. Caller should use `hasAccessToAny` first.
   *
   * If a user has sign in count == 1, is a space admin and the space is not
   * activated, go to `Space Home`.
   *
   */
  function redirectToFirstAccessible () {
    var currentStateName = _.get($state, '$current.name');
    var firstAccessible = getFirstAccessibleSection();
    var userIsAdmin = spaceContext.getData('spaceMembership.admin', false);
    var notActivated = !spaceContext.getData('activatedAt');
    var shouldGoToHome = notActivated && userIsAdmin;
    var targetStateName = [
      BASE_STATE,
      shouldGoToHome ? 'home' : firstAccessible
    ].join('.');

    if (currentStateName === BASE_STATE) {
      if (targetStateName) {
        $state.go(targetStateName, {spaceId: $stateParams.spaceId});
      } else {
        throw new Error('No section to redirect to.');
      }
    }
  }
}]);
