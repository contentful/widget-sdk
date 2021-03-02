import * as React from 'react';
import { CollectionProp } from 'contentful-management/types';
import { Tag } from '@contentful/types';
import { TagVisibilityType } from 'features/content-tags/types';

export type TagsRepoType = {
  createTag: (id: string, name: string, visibility: TagVisibilityType) => Promise<Tag>;
  readTags: (skip: number, limit: number) => Promise<CollectionProp<Tag>>;
  updateTag: (id: string, name: string, version: number) => Promise<Tag>;
  deleteTag: (id: string, version: number) => Promise<boolean>;
};

const TagsRepoContext = React.createContext<TagsRepoType | undefined>(undefined);

export { TagsRepoContext };
