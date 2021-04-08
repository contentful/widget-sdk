import { CollectionProp } from 'contentful-management/types';
import { Tag } from '@contentful/types';

export type TagVisibilityType = 'private' | 'public';
export type TagVisibilityOption = 'private' | 'public' | 'any';

export type TagOption = {
  value: string;
  label: string;
  visibility: TagVisibilityType;
};

export type TagsRepoType = {
  createTag: (id: string, name: string, visibility: TagVisibilityType) => Promise<Tag>;
  readTags: (skip: number, limit: number) => Promise<CollectionProp<Tag>>;
  updateTag: (id: string, name: string, version: number) => Promise<Tag>;
  deleteTag: (id: string, version: number) => Promise<boolean>;
};

export type TagSearchOption = Pick<TagOption, Exclude<keyof TagOption, 'visibility'>>;

export type TagRecordState = TagOption & { occurrence: number };
export type TagRecordStateWithChangeType = TagRecordState & { changeType: string };
