import { useEffect, useState } from 'react';
import { groupByName, tagsPayloadToValues } from 'features/content-tags/editor/utils';
import { useReadTags } from 'features/content-tags/core/hooks/useReadTags';

const useAllTagsGroups = () => {
  const { allData } = useReadTags();
  const [tagGroups, setTagGroups] = useState([]);
  useEffect(() => {
    const allDataTags = tagsPayloadToValues(allData);
    setTagGroups(Object.keys(groupByName(allDataTags)));
  }, [allData, setTagGroups]);
  return tagGroups;
};

export { useAllTagsGroups };
