import { useCallback } from 'react';

import { useAsync } from 'core/hooks';
import { getVariation } from 'LaunchDarkly';
import { getCurrentSpaceFeature, FEATURES } from 'data/CMA/ProductCatalog';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

export const useFeatureFlagVariation = (featureFlag, defaultValue) => {
  const { currentSpaceId, currentEnvironmentId, currentOrganizationId } = useSpaceEnvContext();
  const load = useCallback(async () => {
    return await getVariation(featureFlag, {
      spaceId: currentSpaceId,
      environmentId: currentEnvironmentId,
      organizationId: currentOrganizationId,
    });
  }, [featureFlag, currentSpaceId, currentEnvironmentId, currentOrganizationId]);

  const { data, isLoading, error } = useAsync(load);
  return { spaceFeatureEnabled: error ? defaultValue : !!data, isSpaceFeatureLoading: isLoading };
};

export const useProductCatalogFeatureVariation = (featureFlag, defaultValue) => {
  const load = useCallback(async () => {
    return await getCurrentSpaceFeature(featureFlag, false);
  }, [featureFlag]);

  const { data, isLoading, error } = useAsync(load);
  return { orgFeatureEnabled: error ? defaultValue : !!data, isOrgFeatureLoading: isLoading };
};

export function useFeatureFlagAddToRelease() {
  const { orgFeatureEnabled, isOrgFeatureLoading } = useProductCatalogFeatureVariation(
    FEATURES.PC_SPACE_RELEASES,
    false
  );
  return { addToReleaseEnabled: orgFeatureEnabled, isAddToReleaseLoading: isOrgFeatureLoading };
}

export async function getReleasesFeatureVariation() {
  try {
    const flag = await getCurrentSpaceFeature(FEATURES.PC_SPACE_RELEASES, false);
    return flag;
  } catch (_e) {
    return false;
  }
}
