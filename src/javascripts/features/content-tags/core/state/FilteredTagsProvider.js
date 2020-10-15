import React, { useMemo, useState } from 'react';
import { useReadTags } from 'features/content-tags/core/hooks';
import { ORDER_TAG, tagsSorter } from 'features/content-tags/core/state/tags-sorting';
import { TagTypeAny, TagTypePropType } from 'features/content-tags/core/TagType';
import { createTagsFilter } from 'features/content-tags/core/state/tags-filter';
import { FilteredTagsContext } from './FilteredTagsContext';

function FilteredTagsProvider({ children, tagType = TagTypeAny }) {
  const { data } = useReadTags();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(25);
  const [skip, setSkip] = useState(0);
  const [excludedTags, setExcludedTags] = useState([]);
  const [sorting, setSorting] = useState(ORDER_TAG.DESC);
  const [typeFilter, setTypeFilter] = useState(tagType);
  const cachedTagsFilter = useMemo(() => createTagsFilter(data), [data]);

  const filteredTags = useMemo(() => {
    const tags = cachedTagsFilter({
      tagType: typeFilter,
      match: search,
      exclude: excludedTags,
    });
    const sortedTags = tagsSorter(tags, sorting);
    return sortedTags.slice(skip, Math.min(skip + limit, tags.length));
  }, [cachedTagsFilter, typeFilter, search, excludedTags, sorting, skip, limit]);

  return (
    <FilteredTagsContext.Provider
      value={{
        filteredTags,
        search,
        setSearch,
        limit,
        setLimit,
        skip,
        setSkip,
        excludedTags,
        setExcludedTags,
        sorting,
        setSorting,
        typeFilter,
        setTypeFilter,
      }}>
      {children}
    </FilteredTagsContext.Provider>
  );
}

FilteredTagsProvider.propTypes = {
  tagType: TagTypePropType,
};

export { FilteredTagsProvider };
