import { useCallback } from 'react';
import { useTagsRepo } from 'features/content-tags/core/hooks/useTagsRepo';
import { TagVisibilityType } from 'features/content-tags/types';
import { useAsyncFn } from 'core/hooks';
import { Tag } from '@contentful/types';

function useCreateTag() {
  const tagsRepo = useTagsRepo();

  const createTagCallback = useCallback(
    async (id: string, name: string, visibility: TagVisibilityType) => {
      return tagsRepo.createTag(id, name, visibility);
    },
    [tagsRepo]
  );

  const [
    { isLoading: createTagIsLoading, error: createTagError, data: createTagData },
    createTag,
    resetCreateTag,
  ] = useAsyncFn<Tag, [string, string, TagVisibilityType]>(createTagCallback);

  return {
    createTagIsLoading,
    createTagError,
    createTagData,
    resetCreateTag,
    createTag,
  };
}

export { useCreateTag };
