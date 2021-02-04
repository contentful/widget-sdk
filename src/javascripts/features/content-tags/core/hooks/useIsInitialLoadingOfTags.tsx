import { useReadTags } from 'features/content-tags/core/hooks/useReadTags';
import { useEffect, useState } from 'react';

const useIsInitialLoadingOfTags = (): boolean => {
  const { isLoading } = useReadTags();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [setIsInitialLoad, isLoading]);
  return isInitialLoad;
};

export { useIsInitialLoadingOfTags };
