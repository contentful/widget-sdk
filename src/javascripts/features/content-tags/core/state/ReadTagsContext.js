import React from 'react';

const ReadTagsContext = React.createContext({
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

export { ReadTagsContext };
