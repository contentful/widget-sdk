import { useTagsValuesForIdList } from './useTagsValuesForIdList';
import { TagSelectionValue, TagType } from '../Types';

export const useTagsValuesForTagsList = (
  tags: TagType[]
): { tagValues: TagSelectionValue[]; getUpdatedTags: () => void } => {
  return useTagsValuesForIdList(tags.map(({ sys: { id } }) => id));
};
