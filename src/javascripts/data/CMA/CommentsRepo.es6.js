const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'comments-api'
};

/**
 * Creates a new comment on a specific entry.
 * For a reply to an existing comment provide `parentCommentId`.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {string} entryId
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
      path: ['entries', entryId, 'comments'],
      data: {
        body
      }
    },
    headers
  );
}

/**
 * Creates an assigned comment on a specific entry.
 *
 * @param endpoint
 * @param entryId
 * @param {string} data.body
 * @param {Link<User>} data.assignedTo
 * @param {string?} data.status Defaults to "open".
 * @returns {Promise<API.Comment>}
 */
export async function createAssigned(endpoint, entryId, { body, assignedTo, status }) {
  return endpoint(
    {
      method: 'POST',
      path: ['entries', entryId, 'comments'],
      data: {
        body,
        assignment: {
          assignedTo,
          status
        }
      }
    },
    alphaHeader
  );
}

export async function getAllForEntry(endpoint, entryId) {
  return endpoint(
    {
      method: 'GET',
      path: ['entries', entryId, 'comments']
    },
    alphaHeader
  );
}

export async function remove(endpoint, entryId, commentId) {
  return endpoint(
    {
      method: 'DELETE',
      path: ['entries', entryId, 'comments', commentId]
    },
    alphaHeader
  );
}

export async function update(endpoint, entryId, comment) {
  const headers = {
    'X-Contentful-Version': comment.sys.version,
    ...alphaHeader
  };
  return endpoint(
    {
      method: 'PUT',
      path: ['entries', entryId, 'comments', comment.sys.id],
      data: {
        body: comment.body
      }
    },
    headers
  );
}

export async function updateAssigned(endpoint, entryId, { sys, body, assignedTo, status }) {
  const headers = {
    'X-Contentful-Version': sys.version,
    ...alphaHeader
  };
  return endpoint(
    {
      method: 'PUT',
      path: ['entries', entryId, 'comments', sys.id],
      data: {
        body,
        assignment: {
          assignedTo,
          status
        }
      }
    },
    headers
  );
}
