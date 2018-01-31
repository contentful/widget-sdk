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
  var accessChecker = require('access_control/AccessChecker');
  var spaceContext = require('spaceContext');

  var SECTION_ACCESS_ORDER = [
    ['entry', '.entries.list'],
    ['contentType', '.content_types.list'],
    ['asset', '.assets.list'],
    ['apiKey', '.api.home'],
    ['settings', '.settings.users.list']
  ];

  return {
    getFirstAccessibleSref: getFirstAccessibleSref
  };

  /**
   * @ngdoc method
   * @name sectionAccess#getFirstAccessibleSref
   * @description
   * Returns the first accessible sref of a space. It's relative
   * to `spaces.detail`. Returns `null` if no section can be accessed.
   */
  function getFirstAccessibleSref () {
    var visibility = accessChecker.getSectionVisibility();
    var section = _.find(SECTION_ACCESS_ORDER, function (section) {
      return visibility[section[0]];
    });

    var firstAccessible = _.isArray(section) ? section[1] : null;
    var userIsAdmin = spaceContext.getData('spaceMembership.admin', false);
    var notActivated = !spaceContext.getData('activatedAt');
    var shouldGoToHome = notActivated && userIsAdmin;

    return shouldGoToHome ? '.home' : firstAccessible;
  }
}]);
