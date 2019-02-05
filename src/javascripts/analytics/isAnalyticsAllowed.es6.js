import { get } from 'lodash';

/**
 * @description
 * Returns false if the user or any of the organizations they are a member of
 * has opted out of analytics.
 *
 * @param {API.User} user
 * @return {boolean}
 */
export default function isAnalyticsAllowed(user) {
  const organizations = (user.organizationMemberships || []).map(m => m.organization);
  const organizationDisallows = organizations.some(org => org.disableAnalytics === true);
  const userDisallows = get(user, ['features', 'logAnalytics']) === false;

  const disallowAnalytics = organizationDisallows || userDisallows;

  return !disallowAnalytics;
}
