import { useContext } from 'react';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';

function useTagsRepo() {
  const context = useContext(TagsRepoContext);
  if (!context) throw 'TagsRepo.Provider needed in parent structure.';
  return context;
}

export { useTagsRepo };
