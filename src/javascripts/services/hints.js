'use strict';

/**
 * @ngdoc service
 * @name hints
 * @description
 * Stores and retrieves the seen state of hints shown throughout the
 * app. These hints should only be shown once for each user.
 */
angular.module('contentful')
.service('hints', ['require', function (require) {
  var TheStore = require('TheStore');

  return {
    /**
     * @ngdoc method
     * @name hints#shouldShow
     * @param {string} id
     * @description
     * Checks if a given hint id has been shown before.
    */
    shouldShow: function(id) {
      return !TheStore.get('hint-' + id);
    },

    setAsSeen: function (id) {
      return !TheStore.set('hint-' + id, true);
    }
  };
}]);
