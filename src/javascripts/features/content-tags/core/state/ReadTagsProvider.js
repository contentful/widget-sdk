import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReadTagsContext } from 'features/content-tags/core/state/ReadTagsContext';
import { useTagsRepo } from 'features/content-tags/core/hooks';
import { useAsyncFn } from 'core/hooks';
import { tagsSorter } from 'features/content-tags/core/state/tags-sorting';
import { createTagsFilter } from 'features/content-tags/core/state/tags-filter';

function ReadTagsProvider({ children }) {
  const tagsRepo = useTagsRepo();
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedData, setCachedData] = useState([]);
  const [search, setSearch] = useState('');

  const [excludedTags, setExcludedTags] = useState([]);
  const [sorting, setSorting] = useState('DESC');

  const [{ error, data }, fetchAll] = useAsyncFn(
    useCallback(async () => {
      const getResult = async (skip = 0) => {
        const result = await tagsRepo.readTags(skip, 1000);
        const length = skip + result.items.length;
        if (result.total > length) {
          return [...result.items, ...(await getResult(length))];
        } else {
          return result.items;
        }
      };
      return getResult();
    }, [tagsRepo]),
    true
  );

  useEffect(() => {
    if (typeof tagsRepo.readTags === 'function') {
      fetchAll();
    }
  }, [fetchAll, tagsRepo]);

  useEffect(() => {
    if (data) {
      setIsLoading(false);
      setCachedData(data);
    }
    if (error) {
      setIsLoading(false);
    }
  }, [data, setCachedData, error, setIsLoading]);

  const cachedTagsFilter = useMemo(() => createTagsFilter(cachedData), [cachedData]);

  const reset = useCallback(async () => {
    if (skip === 0) {
      await fetchAll();
    } else {
      setSkip(0);
    }
  }, [skip, setSkip, fetchAll]);

  const dataSize = Math.min(skip + limit, cachedData.length);

  const filteredAndSortedTags = useMemo(() => {
    const tags = cachedTagsFilter({
      match: search.toLowerCase(),
      exclude: excludedTags,
    });
    return tagsSorter(tags, sorting);
  }, [cachedTagsFilter, search, excludedTags, sorting]);

  const currentData = useMemo(() => filteredAndSortedTags.slice(skip, dataSize), [
    skip,
    dataSize,
    filteredAndSortedTags,
  ]);

  const total = cachedData
    ? search && search.length > 0
      ? currentData.length
      : cachedData.length
    : 0;

  if (error) {
    console.error(error);
  }

  const nameExists = useCallback((name) => cachedData.some((tag) => tag.name === name), [
    cachedData,
  ]);

  const idExists = useCallback((id) => cachedData.some((tag) => tag.sys.id === id), [cachedData]);

  const getTag = useCallback((tagId) => cachedData.find((t) => t.sys.id === tagId), [cachedData]);

  return (
    <ReadTagsContext.Provider
      value={{
        data: currentData,
        allData: cachedData,
        isLoading,
        error,
        reset,
        skip,
        setSkip,
        limit,
        setLimit,
        search,
        setSearch,
        total,
        hasTags: cachedData.length > 0,
        nameExists,
        idExists,
        getTag,
        setExcludedTags,
        setSorting,
        sorting,
      }}>
      {children}
    </ReadTagsContext.Provider>
  );
}

export { ReadTagsProvider };
