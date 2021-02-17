import React from 'react';

const FilteredTagsContext = React.createContext({
  filteredTags: [],
  search: '',
  setSearch: (value) => console.warn('called too early', value),
  setLimit: (value) => console.warn('called too early', value),
  setSkip: (value) => console.warn('called too early', value),
  setExcludedTags: (value) => console.warn('called too early', value),
  setSorting: (value) => console.warn('called too early', value),
});

export { FilteredTagsContext };
