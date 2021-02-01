import { useTagsValuesForIdList } from './useTagsValuesForIdList';
import { TagSelectionValue, TagType } from '../Types';

export const useTagsValuesForTagsList = (
  tags: TagType[]
): { tagValues: TagSelectionValue[]; refreshTagValues: () => void } => {
  return useTagsValuesForIdList(tags.map(({ sys: { id } }) => id));
};
