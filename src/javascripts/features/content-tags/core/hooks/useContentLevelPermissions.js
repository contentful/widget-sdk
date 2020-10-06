import { FLAGS } from 'LaunchDarkly';
import { useFeatureFlagVariation } from 'app/Releases/ReleasesFeatureFlag';

const useContentLevelPermissions = () => {
  const { isSpaceFeatureLoading, spaceFeatureEnabled } = useFeatureFlagVariation(
    FLAGS.CONTENT_LEVEL_PERMISSIONS
  );
  return {
    contentLevelPermissionsLoading: isSpaceFeatureLoading,
    contentLevelPermissionsEnabled: !!spaceFeatureEnabled,
  };
};

export { useContentLevelPermissions };
