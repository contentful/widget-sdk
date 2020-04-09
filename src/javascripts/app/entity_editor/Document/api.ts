const COLLECTION_ENDPOINTS = {
  Entry: 'entries',
  Asset: 'assets',
};

export function cmaGetEntity(spaceEndpoint, entityType, entityId) {
  const collection = COLLECTION_ENDPOINTS[entityType];
  const body = {
    method: 'GET',
    path: [collection, entityId],
  };
  return spaceEndpoint(body, {
    'X-Contentful-Skip-Transformation': 'true',
  });
}

// TODO: Inject an EntityRepo instance instead.
export function cmaPutChanges(spaceEndpoint, entity) {
  const collection = COLLECTION_ENDPOINTS[entity.sys.type];
  if (!collection) {
    throw new Error('Invalid entity type');
  }
  const body = {
    method: 'PUT',
    path: [collection, entity.sys.id],
    version: entity.sys.version,
    data: entity,
  };

  return spaceEndpoint(body, {
    'X-Contentful-Skip-Transformation': 'true',
  });
}
