import { TagsRepoType } from './TagsRepoContext';
import { SpaceEndpoint } from 'data/CMA/types';
import { CollectionProp } from 'contentful-management/types';
import { Tag } from '@contentful/types';

function create(spaceEndpoint: SpaceEndpoint, environmentId: string): TagsRepoType {
  async function createTag(id: string, name: string, version?: number) {
    const data = {
      name,
      sys: {
        id,
      },
    };

    let headers = {};
    if (version !== undefined) {
      headers = {
        'X-Contentful-Version': version,
      };
    }

    return await spaceEndpoint<Tag>(
      {
        method: 'PUT',
        path: ['environments', environmentId, 'tags', id],
        data,
      },
      headers
    );
  }

  async function readTags(skip: number, limit: number) {
    return await spaceEndpoint<CollectionProp<Tag>>({
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
