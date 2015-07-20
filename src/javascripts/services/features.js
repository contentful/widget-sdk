'use strict';
/**
 * @ngdoc service
 * @name features
 *
 * @description
 * This service gathers all the different feature flags used across the app.
 * If all feature flags are gathered under this service it should be easy to then
 * find where they are being used and remove them at a later stage.
 *
 * Ideally we should also add a comment to the relevant feature method with some
 * reference to the why of the feature flag being necessary.
*/
angular.module('contentful').factory('features', ['$injector', function FeaturesFactory($injector) {
  var authentication = $injector.get('authentication');

  var user;

  return {
    isPreviewEnabled: isPreviewEnabled,
    shouldAllowAnalytics: shouldAllowAnalytics
  };

  /**
   * @ngdoc method
   * @name features#isPreviewEnabled
   * @description
   * Some users have access to a preview mode which gives them access to newer
   * features.
   *
   * @return {boolean}
  */
  function isPreviewEnabled() {
    user = user ? user : authentication.getUser();
    return !!dotty.get(user, 'features.showPreview', false);
  }

  /**
   * @ngdoc method
   * @name features#shouldAllowAnalytics
   * @description
   * Some of our customers can specify if they want to be tracked via 3rd party
   * analytics services.
   *
   * @return {boolean}
  */
  function shouldAllowAnalytics() {
    user = user ? user : authentication.getUser();
    var organizations = _.pluck(user.organizationMemberships, 'organization');

    var disallowAnalytics = dotty.get(user, 'features.logAnalytics') === false;
    disallowAnalytics = disallowAnalytics || _.any(organizations, function(org){
      return org.disableAnalytics === true;
    });

    return !disallowAnalytics;
  }
}]);
