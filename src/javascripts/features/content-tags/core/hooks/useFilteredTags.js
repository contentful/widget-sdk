import { useContext } from 'react';
import { FilteredTagsContext } from 'features/content-tags/core/state/FilteredTagsContext';

const useFilteredTags = () => {
  const context = useContext(FilteredTagsContext);
  if (!context) throw 'FilteredTagsContext.Provider needed in parent structure.';
  return context;
};

export { useFilteredTags };
