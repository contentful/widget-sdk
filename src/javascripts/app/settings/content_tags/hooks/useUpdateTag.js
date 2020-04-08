import { useCallback } from 'react';
import useTagsRepo from './useTagsRepo';
import { useAsyncFn } from 'app/common/hooks/useAsync';

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
  ] = useAsyncFn(createTagCallback);

  return {
    updateTagIsLoading,
    updateTagError,
    updateTagData,
    resetUpdateTag,
    updateTag,
  };
}

export default useUpdateTag;
