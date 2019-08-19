/**
 * Pattern for matching a CF resource ID within a string.
 * @type {string}
 */
export const RESOURCE_ID_PATTERN = '[a-zA-Z0-9._-]{1,64}';

/**
 *
 * @type {RegExp}
 */
export const RESOURCE_ID_REGEXP = new RegExp(`^${RESOURCE_ID_PATTERN}$`);

/**
 * Returns whether the given string conforms to be a CF resource ID as specified in
 * https://www.contentful.com/developers/docs/references/content-management-api/#/introduction/authentication
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isValidResourceId(id) {
  return RESOURCE_ID_REGEXP.test(id);
}
