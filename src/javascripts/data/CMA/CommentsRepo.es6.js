export async function create(endpoint, entryId, body) {
  return endpoint({
    method: 'POST',
    path: ['entries', entryId, 'comments'],
    data: {
      body
    }
  });
}

export async function getAll(endpoint, entryId) {
  return endpoint({
    method: 'GET',
    path: ['entries', entryId, 'comments']
  });
}

export async function remove(endpoint, entryId, commentId) {
  return endpoint({
    method: 'DELETE',
    path: ['entries', entryId, 'comments', commentId]
  });
}
