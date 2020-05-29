import React, { useCallback, useEffect, useMemo } from 'react';
import { ReadTagsContext } from 'features/content-tags/core/state/ReadTagsContext';
import { useTagsRepo } from 'features/content-tags/core/hooks';
import { useAsyncFn, useStateWithDebounce } from 'core/hooks';

function ReadTagsProvider({ children }) {
  const tagsRepo = useTagsRepo();
  const [skip, setSkip] = React.useState(0);
  const [limit, setLimit] = React.useState(25);
  const [isLoading, setIsLoading] = React.useState(true);
  const [cachedData, setCachedData] = React.useState([]);

  const {
    value: search,
    setValue: setSearch,
    debouncedValue: debouncedSearch,
  } = useStateWithDebounce('');

  const [{ error, data }, fetchAll] = useAsyncFn(
    useCallback(async () => tagsRepo.readTags(0, 1000), [tagsRepo]),
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

  const reset = useCallback(async () => {
    if (skip === 0) {
      await fetchAll();
    } else {
      setSkip(0);
    }
  }, [skip, setSkip, fetchAll]);

  const dataSize = Math.min(skip + limit, cachedData.length);

  const currentData = useMemo(() => {
    return cachedData
      .filter((entry) => {
        const match = debouncedSearch.toLowerCase();
        return (
          entry.name.toLowerCase().includes(match) || entry.sys.id.toLowerCase().includes(match)
        );
      })
      .slice(skip, dataSize);
  }, [cachedData, skip, dataSize, debouncedSearch]);

  const total = cachedData
    ? debouncedSearch && debouncedSearch.length > 0
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
        debouncedSearch,
        total,
        hasTags: cachedData.length > 0,
        nameExists,
        idExists,
        getTag,
      }}>
      {children}
    </ReadTagsContext.Provider>
  );
}

export { ReadTagsProvider };
