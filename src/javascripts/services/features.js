'use strict';
/**
 * @ngdoc service
 * @name features
 */
angular.module('contentful')
.factory('features', [function () {
  return {
    allowAnalytics: allowAnalytics
  };

  /**
   * @ngdoc method
   * @name features#allowAnalytics
   * @description
   * Returns false if the user or any of the organizations they are a member of
   * has opted out of analytics.
   *
   * @param {API.User} user
   * @return {boolean}
  */
  function allowAnalytics (user) {
    var organizations = _.pluck(user.organizationMemberships, 'organization');
    var disallowAnalytics = dotty.get(user, 'features.logAnalytics') === false;
    disallowAnalytics = disallowAnalytics || _.any(organizations, function(org){
      return org.disableAnalytics === true;
    });

    return !disallowAnalytics;
  }
}]);
