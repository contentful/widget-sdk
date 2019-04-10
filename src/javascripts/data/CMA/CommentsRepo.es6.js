export async function create(endpoint, body, { entryId }) {
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
