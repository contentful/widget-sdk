const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'comments-api'
};

export async function create(endpoint, entryId, body, parentCommentId) {
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

export async function getAll(endpoint, entryId) {
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
