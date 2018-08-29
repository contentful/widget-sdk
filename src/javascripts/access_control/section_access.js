'use strict';

/**
 * @ngdoc service
 * @name sectionAccess
 *
 * @description
 * This service makes use of accessChecker's section visibility data to expose
 * utility methods for checking access and redirecting to sections (top menu).
 */
angular.module('contentful').factory('sectionAccess', [
  'require',
  require => {
    const accessChecker = require('access_control/AccessChecker');
    const spaceContext = require('spaceContext');

    const SECTION_ACCESS_ORDER = [
      ['entry', '.entries.list'],
      ['contentType', '.content_types.list'],
      ['asset', '.assets.list'],
      ['apiKey', '.api.keys.list'],
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
    function getFirstAccessibleSref() {
      const visibility = accessChecker.getSectionVisibility();
      const section = _.find(SECTION_ACCESS_ORDER, section => visibility[section[0]]);

      const firstAccessible = _.isArray(section) ? section[1] : null;
      const userIsAdmin = spaceContext.getData('spaceMembership.admin', false);
      const notActivated = !spaceContext.getData('activatedAt');
      const shouldGoToHome = notActivated && userIsAdmin;

      return shouldGoToHome ? '.home' : firstAccessible;
    }
  }
]);
