import React from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getAppsRepo, MarketplaceApp } from '.';

interface PromiseState {
  value?: MarketplaceApp[];
  isLoading?: boolean;
  error?: Error | undefined;
}

/**
 * Returns the resolved value of the given AppRepo method.
 */
function usePromiseWithEnv<T extends 'getOnlyInstalledApps' | 'getContentfulApps'>(methodName: T) {
  const [{ value, error }, setState] = React.useState<PromiseState>({});
  const repo = useAppsRepo();
  const repoCacheKey = repo?._cacheKey;

  let isStale = false;

  React.useEffect(() => {
    if (isStale) return;

    repo?.[methodName]()
      .then((value) => setState({ value }))
      .catch((e) => setState({ isLoading: false, error: e }));

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isStale = true;
    };
  }, [methodName, repo, repoCacheKey]);

  return [value, error] as const;
}

export const useInstalledApps = () => usePromiseWithEnv('getOnlyInstalledApps');
export const useContentfulApps = () => usePromiseWithEnv('getContentfulApps');

export function useAppsRepo() {
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  // this useState is only used to provide a listener to trigger rerender on
  // cache invalidation
  const [, setCacheKey] = React.useState({});

  const repo = currentSpaceId && currentEnvironmentId ? getAppsRepo() : undefined;

  React.useEffect(() => {
    if (!repo) return;

    const removeInvalidatedListener = repo.onCacheInvalidated(() => setCacheKey({}));

    () => removeInvalidatedListener;
  }, [repo]);

  return repo;
}
