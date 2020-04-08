import React, { useCallback, useEffect } from 'react';
import useTagsRepo from '../hooks/useTagsRepo';
import { useAsyncFn } from 'app/common/hooks/useAsync';
import useStateWithDebounce from 'app/common/hooks/useStateWithDebounce';

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
});

function ReadTagsProvider({ children }) {
  const tagsRepo = useTagsRepo();
  const [skip, setSkip] = React.useState(0);
  const [limit, setLimit] = React.useState(25);
  const [cachedData, setCachedData] = React.useState([]);
  const [currentData, setCurrentData] = React.useState([]);

  const {
    value: search,
    setValue: setSearch,
    debouncedValue: debouncedSearch,
  } = useStateWithDebounce('');

  const loadAll = useCallback(async () => {
    return tagsRepo.readTags(0, 1000);
  }, [tagsRepo]);

  const [{ isLoading, error, data }, reloadAll] = useAsyncFn(loadAll, true);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (data) {
      setCachedData(data);
    }
  }, [data, setCachedData]);

  useEffect(() => {
    setCurrentData(
      cachedData.slice(skip, Math.min(skip + limit, cachedData.length)).filter((entry) => {
        const match = debouncedSearch.toLowerCase();
        return (
          entry.name.toLowerCase().includes(match) || entry.sys.id.toLowerCase().includes(match)
        );
      })
    );
  }, [skip, limit, debouncedSearch, cachedData]);

  const reset = useCallback(async () => {
    if (skip === 0) {
      await reloadAll();
    } else {
      setSkip(0);
    }
  }, [skip, setSkip, reloadAll]);

  const total = cachedData
    ? debouncedSearch && debouncedSearch.length > 0
      ? currentData.length
      : cachedData.length
    : 0;

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
      }}>
      {children}
    </ReadTags.Provider>
  );
}

export default ReadTagsProvider;
export { ReadTags };
