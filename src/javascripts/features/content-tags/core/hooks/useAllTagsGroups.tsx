import { useEffect, useState } from 'react';
import { groupByName, tagsPayloadToOptions } from 'features/content-tags/editor/utils';
import { useReadTags } from 'features/content-tags/core/hooks/useReadTags';

const useAllTagsGroups = () => {
  const { data } = useReadTags();
  const [tagGroups, setTagGroups] = useState<string[]>([]);
  useEffect(() => {
    const allDataTags = tagsPayloadToOptions(data);
    setTagGroups(Object.keys(groupByName(allDataTags)));
  }, [data, setTagGroups]);
  return tagGroups;
};

export { useAllTagsGroups };
