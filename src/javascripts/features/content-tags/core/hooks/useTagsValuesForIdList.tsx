import { useReadTags } from 'features/content-tags/core/hooks/useReadTags';
import { useMemo } from 'react';
import { orderByLabel, tagsPayloadToOptions } from 'features/content-tags/editor/utils';
import { TagOption } from 'features/content-tags/types';

export const useTagsValuesForIdList = (tags: string[]): TagOption[] => {
  const { data } = useReadTags();
  return useMemo(() => {
    if (data.length) {
      return orderByLabel(
        tagsPayloadToOptions(data).filter((tag) => tags.some((t) => t === tag.value))
      );
    } else {
      return [];
    }
  }, [tags, data]);
};
