import { useReadTags } from './useReadTags';
import { useMemo } from 'react';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags';
import { TagSelectionValue } from '../Types';

export const useTagsValuesForIdList = (
  tags: string[]
): { tagValues: TagSelectionValue[]; getUpdatedTags: () => void } => {
  const { data, reset } = useReadTags();
  const tagValues = useMemo(() => {
    if (data.length) {
      return orderByLabel(
        tagsPayloadToValues(data).filter((tag) => tags.some((t) => t === tag.value))
      );
    } else {
      return [];
    }
  }, [tags, data]);
  return {
    tagValues,
    getUpdatedTags: (reset as unknown) as () => void,
  };
};
