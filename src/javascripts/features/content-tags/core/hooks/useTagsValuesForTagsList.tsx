import { useTagsValuesForIdList } from './useTagsValuesForIdList';
import { TagSelectionValue, TagType } from '../Types';

export const useTagsValuesForTagsList = (tags: TagType[]): TagSelectionValue[] => {
  return useTagsValuesForIdList(tags.map(({ sys: { id } }) => id));
};
