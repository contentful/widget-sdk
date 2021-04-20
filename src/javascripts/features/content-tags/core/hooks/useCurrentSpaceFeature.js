import { useCallback } from 'react';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { useAsync } from 'core/hooks';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';

/*
 * React hook to retrieve a Product Catalog feature flag for current space.
 * @param {string} featureId - id of the feature flag you want to retrieve.
 * @param {string} defaultValue - default value used if flag not present.
 */
function useCurrentSpaceFeature(featureId, defaultValue) {
  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  const load = useCallback(async () => {
    return getSpaceFeature(spaceId, featureId, defaultValue);
  }, [featureId, defaultValue, spaceId]);

  const { data, isLoading } = useAsync(load);
  return { spaceFeatureEnabled: !!data, isSpaceFeatureLoading: isLoading };
}

export { useCurrentSpaceFeature };
