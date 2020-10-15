import React from 'react';

const FilteredTagsContext = React.createContext({
  filteredTags: [],
  setSearch: null,
  setLimit: null,
  setSkip: null,
  setExcludedTags: null,
  setSorting: null,
  setTypeFilter: null,
});

export { FilteredTagsContext };
