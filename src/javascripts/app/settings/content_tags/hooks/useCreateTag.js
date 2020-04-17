import { useCallback } from 'react';
import useTagsRepo from './useTagsRepo';
import { useAsyncFn } from 'core/hooks';

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
  ] = useAsyncFn(createTagCallback);

  return {
    createTagIsLoading,
    createTagError,
    createTagData,
    resetCreateTag,
    createTag,
  };
}

export default useCreateTag;
