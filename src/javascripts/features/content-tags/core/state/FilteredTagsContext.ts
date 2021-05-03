import React from 'react';

const FilteredTagsContext = React.createContext({
  filteredTags: [],
  search: '',
  limit: 0,
  skip: 0,
  setSearch: (value) => console.warn('called too early', value),
  setLimit: (value) => console.warn('called too early', value),
  setSkip: (value) => console.warn('called too early', value),
  setExcludedTags: (value) => console.warn('called too early', value),
  setSorting: (value) => console.warn('called too early', value),
  setVisibility: (value) => console.warn('called too early', value),
});

export { FilteredTagsContext };