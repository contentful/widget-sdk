function create(spaceEndpoint, environmentId) {
  async function createTag(id, name, version) {
    const data = {
      name,
      sys: {
        id,
      },
    };
    return await spaceEndpoint(
      {
        method: 'PUT',
        path: ['environments', environmentId, 'tags', id],
        data,
      },
      {
        'X-Contentful-Version': version,
      }
    );
  }

  async function readTags(skip, limit) {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['environments', environmentId, 'tags'],
      query: { limit, skip },
    });
    return items;
  }

  async function updateTag(id, name, version) {
    return createTag(id, name, version);
  }

  async function deleteTag(id, version) {
    return await spaceEndpoint(
      {
        method: 'DELETE',
        path: ['environments', environmentId, 'tags', id],
      },
      {
        'X-Contentful-Version': version,
      }
    ).then(() => true);
  }

  return { createTag, readTags, updateTag, deleteTag };
}

export { create };
