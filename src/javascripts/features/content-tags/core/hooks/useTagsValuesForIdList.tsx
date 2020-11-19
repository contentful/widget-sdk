import { useReadTags } from './useReadTags';
import { useMemo } from 'react';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags';
import { TagSelectionValue } from '../Types';

export const useTagsValuesForIdList = (tags: string[]): TagSelectionValue[] => {
  const { data } = useReadTags();
  return useMemo(() => {
    if (data.length) {
      return orderByLabel(
        tagsPayloadToValues(data).filter((tag) => tags.some((t) => t === tag.value))
      );
    } else {
      return [];
    }
  }, [tags, data]);
};
