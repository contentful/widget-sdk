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
  view_roles: [
    // Jakub's private org (prod)
    '2d1a93a348d003ae117ee423cb9e89e4',
    // Contentful main (prod)
    '281d50856fc72daca2e39b4e68bdb3ee',
    // Google Docs Test (preview)
    'afbd22d6944eb429cf2b16d5a8ad279b',
    // Capital One (prod)
    '484282f25eeac45516812e9de55357ef'
  ],
  collections: [
    // Contentful main (prod)
    '281d50856fc72daca2e39b4e68bdb3ee',
    // Google Docs Test (preview)
    'afbd22d6944eb429cf2b16d5a8ad279b'
  ]
};

const FEATURE_TO_SPACE_IDS = {
  view_roles: [
    // Jakub's contentfiddle space (prod)
    'f6868d368b5e2fc62d0a3fc7ab6eb29e',

    // Eli Lilly GSIT-CONN-CONNECT (prod)
    '3e027c8e222e4efdb3d82dacd4f9db6b',
    // Eli Lilly gsit-conn-connect-tst (prod)
    // 'bfb379e41c085d18f4cf95ff4df31e26',
    // Eli Lilly GSIT-CONN-CONNECT-MIG (prod)
    // '852fca113cb2dd65c563dfc56c63ceab',
    // Eli Lilly gsit-conn-connect-dmo (prod)
    // 'e1f053b6ad94769135505bfdbb0be407',
    // Eli Lilly GSIT-CONN-CONNECT-STG (prod)
    // '6ec110b6d3c1bb19d76c04ee612b55c4',
    // Eli Lilly IdentityHub-DEV (prod)
    // 'dceb6b907bf7707ac4e75cc3894c460a',

    // TELUS digital [G] > Legal (prod)
    'e890507ca8569c47aea8188a50ef9b19',
    // TELUS digital [G] Products & Services (prod)
    '1a0c43b1f1ff4fc432c52dc4cf64e96c',
    // TELUS digital BUS > Marketing Prod (prod)
    '8f0b0f8ae17203663d458c20092dc430',
    // TELUS digital C MOB > Accessories (prod)
    '97c56b9d15c6a7ae389d6632877543d4',
    // TELUS digital C MOB > Marketing (prod)
    'e908a9e5d6ea0330fa5c661d1477c8de'
  ],
  collections: []
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
