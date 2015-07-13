'use strict';

/**
 * @ngdoc service
 * @name hints
 * @description
 * Stores and retrieves the seen state of hints shown throughout the app.
 * These hints should only be shown once for each user.
 *
*/
angular.module('contentful').service('hints', ['$injector', function($injector) {

  var $window = $injector.get('$window');

  return {
    /**
     * @ngdoc method
     * @name hints#shouldShow
     * @param {string} id
     * @description
     * Checks if a given hint id has been shown before.
     * If not, marks it as seen.
    */
    shouldShow: function(id) {
      id = 'hint-'+id;
      return !$window.localStorage.getItem(id);
    },

    setAsSeen: function (id) {
      id = 'hint-'+id;
      $window.localStorage.setItem(id, true);
    }
  };

}]);
