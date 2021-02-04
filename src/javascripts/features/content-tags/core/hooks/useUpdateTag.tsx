import { useCallback } from 'react';
import { useTagsRepo } from 'features/content-tags/core/hooks/useTagsRepo';
import { useAsyncFn } from 'core/hooks';
import { Tag } from '@contentful/types';

function useUpdateTag() {
  const tagsRepo = useTagsRepo();

  const createTagCallback = useCallback(
    async (id, name, version) => {
      return tagsRepo.updateTag(id, name, version);
    },
    [tagsRepo]
  );

  const [
    { isLoading: updateTagIsLoading, error: updateTagError, data: updateTagData },
    updateTag,
    resetUpdateTag,
  ] = useAsyncFn<Tag, [string, string, number]>(createTagCallback);

  return {
    updateTagIsLoading,
    updateTagError,
    updateTagData,
    resetUpdateTag,
    updateTag,
  };
}

export { useUpdateTag };
