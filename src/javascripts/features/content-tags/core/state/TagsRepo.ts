import { TagsRepoType } from './TagsRepoContext';

function create(spaceEndpoint: any, environmentId: string): TagsRepoType {
  async function createTag(id: string, name: string, version?: number) {
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

  async function readTags(skip: number, limit: number) {
    return await spaceEndpoint({
      method: 'GET',
      path: ['environments', environmentId, 'tags'],
      query: { limit, skip },
    });
  }

  async function updateTag(id: string, name: string, version: number) {
    return createTag(id, name, version);
  }

  async function deleteTag(id: string, version: number) {
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
