import React, { useCallback, useEffect, useMemo } from 'react';
import useTagsRepo from '../hooks/useTagsRepo';
import { useStateWithDebounce, useAsyncFn } from 'core/hooks';

const ReadTags = React.createContext({
  data: [],
  isLoading: false,
  error: null,
  reset: null,
  skip: 0,
  total: 0,
  limit: 0,
  setSkip: null,
  setLimit: null,
  search: null,
  setSearch: null,
  debouncedSearch: null,
  hasTags: false,
});

function ReadTagsProvider({ children }) {
  const tagsRepo = useTagsRepo();
  const [skip, setSkip] = React.useState(0);
  const [limit, setLimit] = React.useState(25);
  const [cachedData, setCachedData] = React.useState([]);

  const {
    value: search,
    setValue: setSearch,
    debouncedValue: debouncedSearch,
  } = useStateWithDebounce('');

  const [{ isLoading, error, data }, fetchAll] = useAsyncFn(
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
      setCachedData(data);
    }
  }, [data, setCachedData]);

  const reset = useCallback(async () => {
    if (skip === 0) {
      await fetchAll();
    } else {
      setSkip(0);
    }
  }, [skip, setSkip, fetchAll]);

  const dataSize = Math.min(skip + limit, cachedData.length);

  const currentData = useMemo(() => {
    return cachedData.slice(skip, dataSize).filter((entry) => {
      const match = debouncedSearch.toLowerCase();
      return entry.name.toLowerCase().includes(match) || entry.sys.id.toLowerCase().includes(match);
    });
  }, [cachedData, skip, dataSize, debouncedSearch]);

  const total = cachedData
    ? debouncedSearch && debouncedSearch.length > 0
      ? currentData.length
      : cachedData.length
    : 0;

  if (error) {
    console.error(error);
  }

  return (
    <ReadTags.Provider
      value={{
        data: currentData,
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
      }}>
      {children}
    </ReadTags.Provider>
  );
}

export default ReadTagsProvider;
export { ReadTags };
