/**
 * Returns whether the given string conforms to be a CF resource ID as specified in
 * https://www.contentful.com/developers/docs/references/content-management-api/#/introduction/authentication
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isValidResourceId(id) {
  return /^[a-zA-Z0-9._-]{1,64}$/.test(id);
}
