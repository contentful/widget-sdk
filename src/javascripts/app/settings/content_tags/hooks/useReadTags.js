import { ReadTags } from '../providers/ReadTagsProvider';
import { useContext } from 'react';

function useReadTags() {
  const context = useContext(ReadTags);
  if (!context) throw 'ReadTags.Provider needed in parent structure.';
  return context;
}

export default useReadTags;
