import { useEffect, useState } from 'react';
import { groupByName, tagsPayloadToValues } from 'features/content-tags/editor/utils';
import { useReadTags } from 'features/content-tags/core/hooks/useReadTags';

const useAllTagsGroups = () => {
  const { data } = useReadTags();
  const [tagGroups, setTagGroups] = useState([]);
  useEffect(() => {
    const allDataTags = tagsPayloadToValues(data);
    setTagGroups(Object.keys(groupByName(allDataTags)));
  }, [data, setTagGroups]);
  return tagGroups;
};

export { useAllTagsGroups };
