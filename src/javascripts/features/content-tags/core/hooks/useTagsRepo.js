import { useContext } from 'react';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';

function useTagsRepo() {
  return useContext(TagsRepoContext);
}

export { useTagsRepo };
