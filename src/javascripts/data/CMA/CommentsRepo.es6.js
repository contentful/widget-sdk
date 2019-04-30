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
