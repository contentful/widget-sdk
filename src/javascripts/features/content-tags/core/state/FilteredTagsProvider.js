import React, { useMemo, useState } from 'react';
import { useReadTags } from 'features/content-tags/core/hooks';
import { ORDER_TAG, tagsSorter } from 'features/content-tags/core/state/tags-sorting';
import {
  createTagsFilter,
  TAG_VISILBILITY_OPTIONS,
} from 'features/content-tags/core/state/tags-filter';
import { FilteredTagsContext } from './FilteredTagsContext';

function FilteredTagsProvider({ children }) {
  const { data } = useReadTags();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(25);
  const [skip, setSkip] = useState(0);
  const [excludedTags, setExcludedTags] = useState([]);
  const [sorting, setSorting] = useState(ORDER_TAG.DESC);
  const [visibility, setVisibility] = useState(TAG_VISILBILITY_OPTIONS.ANY);
  const cachedTagsFilter = useMemo(() => createTagsFilter(data), [data]);

  const filteredTags = useMemo(() => {
    const tags = cachedTagsFilter({
      match: search,
      exclude: excludedTags,
      visibility,
    });
    const sortedTags = tagsSorter(tags, sorting);
    return sortedTags.slice(skip, Math.min(skip + limit, tags.length));
  }, [cachedTagsFilter, search, excludedTags, sorting, skip, limit, visibility]);

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
        setVisibility,
      }}>
      {children}
    </FilteredTagsContext.Provider>
  );
}

FilteredTagsProvider.propTypes = {};

export { FilteredTagsProvider };
