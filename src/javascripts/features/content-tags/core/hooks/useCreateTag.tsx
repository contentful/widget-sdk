import { useCallback } from 'react';
import { useTagsRepo } from 'features/content-tags/core/hooks/useTagsRepo';
import { useAsyncFn } from 'core/hooks';
import { Tag } from '@contentful/types';

function useCreateTag() {
  const tagsRepo = useTagsRepo();

  const createTagCallback = useCallback(
    async (id, name) => {
      return tagsRepo.createTag(id, name);
    },
    [tagsRepo]
  );

  const [
    { isLoading: createTagIsLoading, error: createTagError, data: createTagData },
    createTag,
    resetCreateTag,
  ] = useAsyncFn<Tag, [string, string]>(createTagCallback);

  return {
    createTagIsLoading,
    createTagError,
    createTagData,
    resetCreateTag,
    createTag,
  };
}

export { useCreateTag };
