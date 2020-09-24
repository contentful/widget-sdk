import React from 'react';

const ReadTagsContext = React.createContext({
  data: [],
  allData: [],
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
  hasTags: false,
  nameExists: null,
  idExists: null,
  getTag: null,
  setExcludedTags: null,
  setSorting: null,
  sorting: null,
  setTypeFilter: null,
  typeFilter: null,
});

export { ReadTagsContext };
