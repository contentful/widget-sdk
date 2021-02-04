import { ReadTagsContext } from 'features/content-tags/core/state/ReadTagsContext';
import { useContext } from 'react';

function useReadTags() {
  const context = useContext(ReadTagsContext);
  if (!context) throw 'ReadTags.Provider needed in parent structure.';
  return context;
}

export { useReadTags };
