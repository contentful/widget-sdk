import { COMMENTS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(COMMENTS_API);

const path = (entryId, commentId) => [
  'entries',
  entryId,
  'comments',
  ...(commentId ? [commentId] : [])
];

/**
 * Creates a new comment on a specific entry.
 * For a reply to an existing comment provide `parentCommentId`.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {string} data.body
 * @param {string?} data.parentCommentId
 * @returns {Promise<API.Comment>}
 */
export async function create(endpoint, entryId, { body, parentCommentId = null }) {
  const headers = parentCommentId
    ? { 'x-contentful-parent-id': parentCommentId, ...alphaHeader }
    : alphaHeader;
  return endpoint(
    {
      method: 'POST',
      path: path(entryId),
      data: {
        body
      }
    },
    headers
  );
}

/**
 * Returns all of an entry's comments.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @returns {Promise<API.Comment>}
 */
export async function getAllForEntry(endpoint, entryId) {
  const result = await endpoint(
    {
      method: 'GET',
      path: path(entryId)
    },
    alphaHeader
  );
  // TODO: Remove filter once we removed tasks from `/comments` endpoint.
  result.items = result.items.filter(item => !item.assignment);
  return result;
}

/**
 * Deletes a Comment.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {Stirng} commentId
 */
export async function remove(endpoint, entryId, commentId) {
  return endpoint(
    {
      method: 'DELETE',
      path: path(entryId, commentId)
    },
    alphaHeader
  );
}

/**
 * Updates a comment.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {API.Comment} comment
 * @returns {Promise<Comment>}
 */
export async function update(endpoint, entryId, comment) {
  const headers = {
    'X-Contentful-Version': comment.sys.version,
    ...alphaHeader
  };
  return endpoint(
    {
      method: 'PUT',
      path: path(entryId, comment.sys.id),
      data: {
        body: comment.body
      }
    },
    headers
  );
}
