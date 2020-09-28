import { useCallback } from 'react';
import { useTagsRepo } from 'features/content-tags/core/hooks/useTagsRepo';
import { useAsyncFn } from 'core/hooks';

function useCreateTag() {
  const tagsRepo = useTagsRepo();

  const createTagCallback = useCallback(
    async (id, name, tagType) => {
      return tagsRepo.createTag(id, name, tagType);
    },
    [tagsRepo]
  );

  const [
    { isLoading: createTagIsLoading, error: createTagError, data: createTagData },
    createTag,
    resetCreateTag,
  ] = useAsyncFn(createTagCallback);

  return {
    createTagIsLoading,
    createTagError,
    createTagData,
    resetCreateTag,
    createTag,
  };
}

export { useCreateTag };
