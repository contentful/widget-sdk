import useTagsRepo from './useTagsRepo';
import { useAsyncFn } from 'app/common/hooks/useAsync';
import { useCallback } from 'react';

function useDeleteTag() {
  const tagsRepo = useTagsRepo();

  const deleteTagCallback = useCallback(
    async (id, version) => {
      return tagsRepo.deleteTag(id, version);
    },
    [tagsRepo]
  );
  const [
    { isLoading: deleteTagIsLoading, error: deleteTagError, data: deleteTagData },
    deleteTag,
    resetDeleteTag,
  ] = useAsyncFn(deleteTagCallback);

  return {
    deleteTagIsLoading,
    deleteTagError,
    resetDeleteTag,
    deleteTagData,
    deleteTag,
  };
}

export default useDeleteTag;