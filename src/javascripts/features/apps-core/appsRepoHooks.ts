import React from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { NonInstallableMarketplaceApp } from './types';
import { getAppsRepo } from '.';

interface PromiseState {
  value?: NonInstallableMarketplaceApp[];
  isLoading?: boolean;
  error?: Error | undefined;
}

/**
 * Returns the resolved value of the given AppRepo method.
 */
function usePromiseWithEnv<T extends 'getOnlyInstalledApps' | 'getContentfulAppsListing'>(
  methodName: T
) {
  const [{ value, error }, setState] = React.useState<PromiseState>({});
  const repo = useAppsRepo();
  const repoCacheKey = repo?._cacheKey;

  let isStale = false;

  React.useEffect(() => {
    let isMounted = true;

    if (isStale) return;

    repo?.[methodName]()
      .then((value) => isMounted && setState({ value }))
      .catch((e) => isMounted && setState({ isLoading: false, error: e }));

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isStale = true;
      isMounted = false;
    };
  }, [methodName, repo, repoCacheKey]);

  return [value, error] as const;
}

export const useInstalledApps = () => usePromiseWithEnv('getOnlyInstalledApps');
export const useContentfulApps = () => usePromiseWithEnv('getContentfulAppsListing');

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
