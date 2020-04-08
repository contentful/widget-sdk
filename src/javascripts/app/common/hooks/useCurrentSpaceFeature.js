import { useCallback } from 'react';
import { getCurrentSpaceFeature } from 'data/CMA/ProductCatalog';
import { useAsync } from './useAsync';

/*
 * React hook to retrieve a Product Catalog feature flag for current space.
 * @param {string} featureId - id of the feature flag you want to retrieve.
 * @param {string} defaultValue - default value used if flag not present.
 */
function useCurrentSpaceFeature(featureId, defaultValue) {
  const load = useCallback(async () => {
    return getCurrentSpaceFeature(featureId, defaultValue);
  }, [featureId, defaultValue]);

  const { data, isLoading } = useAsync(load);
  return { spaceFeatureEnabled: data, isSpaceFeatureLoading: isLoading };
}

export default useCurrentSpaceFeature;
