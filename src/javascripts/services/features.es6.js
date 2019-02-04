import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  /**
   * @ngdoc service
   * @name features
   */
  registerFactory('features', () => {
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
    function allowAnalytics(user) {
      const organizations = _.map(user.organizationMemberships, 'organization');
      let disallowAnalytics = _.get(user, 'features.logAnalytics') === false;
      disallowAnalytics =
        disallowAnalytics || _.some(organizations, org => org.disableAnalytics === true);

      return !disallowAnalytics;
    }
  });
}
