import {get as getAtPath} from 'lodash';
import md5 from 'md5';

const ORG_ID_PATH = ['data', 'organization', 'sys', 'id'];

/**
 * @ngdoc service
 * @name analytics/OrganizationTargeting
 * @description
 * A service that allows to target selected
 * organizations with "testable" features.
 *
 * `FEATURE_TO_ORG_IDS` is a map of feature
 * keys to arrays of *hashed* organization IDs.
 *
 * A hash can be generated with this command:
 * `node -e "console.log(require('blueimp-md5')('orgid'))"`
 *
 * Make sure you add a comment telling which
 * organization is represented by the hash.
 */

const FEATURE_TO_ORG_IDS = {
  view_roles: [
    // Jakub's private org (prod)
    '2d1a93a348d003ae117ee423cb9e89e4',
    // Contentful main (prod)
    '281d50856fc72daca2e39b4e68bdb3ee',
    // Google Docs Test (preview)
    'afbd22d6944eb429cf2b16d5a8ad279b'
  ]
};

/**
 * @ngdoc method
 * @name analytics/OrganizationTargeting#default
 * @param {string} featureKey
 * @param {Space}  space
 * @returns {boolean}
 * @description
 * Returns `true` if the feature with `featureKey`
 * is enabled for the current organization.
 * Returns `false` otherwise.
 */
export default function isEnabled (featureKey, space) {
  const hashes = FEATURE_TO_ORG_IDS[featureKey];
  const orgId = getAtPath(space, ORG_ID_PATH);

  if (Array.isArray(hashes)) {
    return hashes.indexOf(md5(orgId)) > -1;
  } else {
    throw new Error(`Unknown feature: ${featureKey}`);
  }
}
