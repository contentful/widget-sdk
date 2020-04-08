import { useContext } from 'react';
import { TagsRepoContext } from '../providers/TagsRepoProvider';

function useTagsRepo() {
  return useContext(TagsRepoContext);
}

export default useTagsRepo;
