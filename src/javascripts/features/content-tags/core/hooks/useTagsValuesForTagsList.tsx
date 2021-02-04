import { useTagsValuesForIdList } from './useTagsValuesForIdList';
import { Tag } from '@contentful/types';
import { TagOption } from '../../types';

export const useTagsValuesForTagsList = (tags: Tag[]): TagOption[] => {
  return useTagsValuesForIdList(tags.map(({ sys: { id } }) => id));
};
