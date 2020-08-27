import { useCallback } from 'react';

import { getModule } from 'core/NgRegistry';
import { useAsync } from 'core/hooks';
import { useSpaceContext } from 'features/content-tags';
import { FLAGS, getVariation } from 'LaunchDarkly';

const useFeatureFlagVariation = (featureFlag, defaultValue) => {
  const spaceContext = useSpaceContext();
  const load = useCallback(async () => {
    return await getVariation(featureFlag, {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      organizationId: spaceContext.getData(['organization', 'sys', 'id']),
    });
  }, [featureFlag, spaceContext]);
  const { data, isLoading, error } = useAsync(load);
  return { spaceFeatureEnabled: error ? defaultValue : !!data, isSpaceFeatureLoading: isLoading };
};

export function useFeatureFlagAddToRelease() {
  const { spaceFeatureEnabled, isSpaceFeatureLoading } = useFeatureFlagVariation(
    FLAGS.ADD_TO_RELEASE,
    false
  );
  return { addToReleaseEnabled: spaceFeatureEnabled, isAddToReleaseLoading: isSpaceFeatureLoading };
}

export async function getReleasesFeatureVariation() {
  try {
    const spaceContext = getModule('spaceContext');
    const flag = await getVariation(FLAGS.ADD_TO_RELEASE, {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      organizationId: spaceContext.getData(['organization', 'sys', 'id']),
    });

    return flag;
  } catch (_e) {
    return false;
  }
}
