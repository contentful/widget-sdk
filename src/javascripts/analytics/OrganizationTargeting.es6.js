import {get as getAtPath} from 'lodash';
import md5 from 'md5';

const SPACE_ID_PATH = ['data', 'sys', 'id'];
const ORG_ID_PATH = ['data', 'organization', 'sys', 'id'];

/**
 * @ngdoc service
 * @name analytics/OrganizationTargeting
 * @description
 * A service that allows to target selected
 * organizations and spaces with "testable"
 * features.
 *
 * Configuration is stored in two maps:
 *
 * - `FEATURE_TO_ORG_IDS` is a map of feature
 *   keys to arrays of *hashed* organization IDs.
 * - `FEATURE_TO_SPACE_IDS` is a map of feature
 *   keys to arrays of *hashed* space IDs.
 * - A feature is enabled for a space if either
 *   the space is whitelisted or the organization
 *   of the space is whitelisted.
 * - Feature keys must be added to both maps,
 *   an empty array should be used as a value if
 *   no space/organization targeting is needed.
 *
 * A hash can be generated with this command:
 * `node -e "console.log(require('blueimp-md5')('id'))"`
 *
 * Make sure you add a comment telling which
 * space/organization is represented by the hash.
 */

const FEATURE_TO_ORG_IDS = {
  collections: [
    // Contentful main (prod)
    '281d50856fc72daca2e39b4e68bdb3ee',
    // Google Docs Test (preview)
    'afbd22d6944eb429cf2b16d5a8ad279b'
  ]
};

const FEATURE_TO_SPACE_IDS = {
  collections: [
    // Community member interested in testing (prod)
    '185555fa5b5f0862f2b80885ae5c8c68'
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
 * is enabled for the given space or its organization.
 * Returns `false` otherwise.
 */
export default function isEnabled (featureKey, space) {
  const spaceIdHashes = FEATURE_TO_SPACE_IDS[featureKey];
  const orgIdHashes = FEATURE_TO_ORG_IDS[featureKey];

  if (Array.isArray(spaceIdHashes) && Array.isArray(orgIdHashes)) {
    const spaceId = getAtPath(space, SPACE_ID_PATH);
    const orgId = getAtPath(space, ORG_ID_PATH);
    const hasHashed = (coll, id) => coll.indexOf(md5(id)) > -1;
    return hasHashed(spaceIdHashes, spaceId) || hasHashed(orgIdHashes, orgId);
  } else {
    throw new Error(`Unknown feature: ${featureKey}`);
  }
}
