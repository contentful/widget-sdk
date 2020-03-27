import { COMMENTS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(COMMENTS_API);

const path = (entryId, commentId) => [
  'entries',
  entryId,
  'comments',
  ...(commentId ? [commentId] : []),
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
  return endpoint(
    {
      method: 'POST',
      path: path(entryId),
      data: {
        body,
      },
    },
    {
      ...alphaHeader,
      ...(parentCommentId && { 'x-contentful-parent-id': parentCommentId }),
    }
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
      path: path(entryId),
    },
    alphaHeader
  );
  // TODO: Remove filter once we removed tasks from `/comments` endpoint.
  return {
    ...result,
    items: result.items.filter((item) => !item.assignedTo),
  };
}

/**
 * Deletes a Comment.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {API.Comment} comment
 */
export async function remove(endpoint, entryId, comment) {
  return endpoint(
    {
      method: 'DELETE',
      path: path(entryId, comment.sys.id),
    },
    {
      ...alphaHeader,
      'X-Contentful-Version': comment.sys.version,
    }
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
  return endpoint(
    {
      method: 'PUT',
      path: path(entryId, comment.sys.id),
      data: {
        body: comment.body,
      },
    },
    {
      ...alphaHeader,
      'X-Contentful-Version': comment.sys.version,
    }
  );
}
