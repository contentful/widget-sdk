import { useCallback } from 'react';
import { useTagsRepo } from 'features/content-tags/core/hooks/useTagsRepo';
import { useAsyncFn } from 'core/hooks';

function useUpdateTag() {
  const tagsRepo = useTagsRepo();

  const createTagCallback = useCallback(
    async (id, name, tagType, version) => {
      return tagsRepo.updateTag(id, name, tagType, version);
    },
    [tagsRepo]
  );

  const [
    { isLoading: updateTagIsLoading, error: updateTagError, data: updateTagData },
    updateTag,
    resetUpdateTag,
  ] = useAsyncFn(createTagCallback);

  return {
    updateTagIsLoading,
    updateTagError,
    updateTagData,
    resetUpdateTag,
    updateTag,
  };
}

export { useUpdateTag };
