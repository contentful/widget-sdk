function create(spaceEndpoint, environmentId) {
  async function createTag(id, name, tagType, version) {
    const data = {
      name,
      sys: {
        id,
        tagType,
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
    return await spaceEndpoint({
      method: 'GET',
      path: ['environments', environmentId, 'tags'],
      query: { limit, skip },
    });
  }

  async function updateTag(id, name, tagType, version) {
    return createTag(id, name, tagType, version);
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
