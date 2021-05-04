import { SpaceEndpoint } from 'data/CMA/types';
import { CollectionProp } from 'contentful-management/types';
import { TagVisibilityType, TagsRepoType } from 'features/content-tags/types';
import { Tag } from '@contentful/types';

/**
 * @deprecated use CMAClient instead
 * {@link getCMAClient}
 */
function create(spaceEndpoint: SpaceEndpoint, environmentId: string): TagsRepoType {
  /**
   * @deprecated use CMAClient.tag.create
   * {@link https://github.com/contentful/contentful-management.js/blob/master/lib/plain/common-types.ts#L539}
   */
  async function createTag(id: string, name: string, visibility: TagVisibilityType) {
    const data = {
      name,
      sys: {
        id,
        visibility,
      },
    };

    return await spaceEndpoint<Tag>({
      method: 'PUT',
      path: ['environments', environmentId, 'tags', id],
      data,
    });
  }

  /**
   * @deprecated use CMAClient.tag.getMany
   * {@link https://github.com/contentful/contentful-management.js/blob/master/lib/plain/common-types.ts#L536}
   */
  async function readTags(skip: number, limit: number) {
    return await spaceEndpoint<CollectionProp<Tag>>({
      method: 'GET',
      path: ['environments', environmentId, 'tags'],
      query: { limit, skip },
    });
  }
  /**
   * @deprecated use CMAClient.tag.update
   * {@link https://github.com/contentful/contentful-management.js/blob/master/lib/plain/common-types.ts#L540}
   */
  async function updateTag(id: string, name: string, version: number) {
    const data = {
      name,
    };
    return await spaceEndpoint<Tag>(
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

  /**
   * @deprecated use CMAClient.tag.delete
   * {@link https://github.com/contentful/contentful-management.js/blob/master/lib/plain/common-types.ts#L545}
   */
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
