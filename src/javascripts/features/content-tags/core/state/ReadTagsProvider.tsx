import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { ReadTagsContext } from 'features/content-tags/core/state/ReadTagsContext';
import { useTagsRepo } from 'features/content-tags/core/hooks';
import { useAsyncFn } from 'core/hooks';
import { SpaceFeatures, getSpaceFeature } from 'data/CMA/ProductCatalog';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { Tag } from '@contentful/types';

type Props = PropsWithChildren<{}>;

const ReadTagsProvider: React.FC<Props> = ({ children }) => {
  const tagsRepo = useTagsRepo();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cachedData, setCachedData] = useState<Tag[]>([]);
  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  const [{ error, data }, fetchAll] = useAsyncFn(
    useCallback(async () => {
      if (!(await getSpaceFeature(spaceId, SpaceFeatures.PC_CONTENT_TAGS, false)) || !tagsRepo) {
        return [];
      }
      const getResult = async (skip = 0) => {
        const result = await tagsRepo.readTags(skip, 1000);
        const length = skip + result.items.length;
        if (result.total > length) {
          return [...result.items, ...(await getResult(length))];
        } else {
          return result.items;
        }
      };
      return getResult();
    }, [tagsRepo, spaceId]),
    true
  );

  useEffect(() => {
    if (typeof tagsRepo?.readTags === 'function') {
      fetchAll();
    }
  }, [fetchAll, tagsRepo]);

  useEffect(() => {
    if (data) {
      setIsLoading(false);
      setCachedData(data);
    }
    if (error) {
      setIsLoading(false);
    }
  }, [data, setCachedData, error, setIsLoading]);

  const reset = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  if (error) {
    console.error(error);
  }

  const nameExists = useCallback((name) => cachedData.some((tag) => tag.name === name), [
    cachedData,
  ]);

  const idExists = useCallback((id) => cachedData.some((tag) => tag.sys.id === id), [cachedData]);

  const getTag = useCallback((tagId) => cachedData.find((t) => t.sys.id === tagId), [cachedData]);

  const addTag = useCallback(
    (tagData) => {
      setCachedData((prevState) => [...prevState, tagData]);
    },
    [setCachedData]
  );

  return (
    <ReadTagsContext.Provider
      value={{
        data: cachedData,
        addTag,
        isLoading,
        error,
        reset,
        total: cachedData.length,
        hasTags: cachedData.length > 0,
        nameExists,
        idExists,
        getTag,
      }}>
      {children}
    </ReadTagsContext.Provider>
  );
};

export { ReadTagsProvider };
