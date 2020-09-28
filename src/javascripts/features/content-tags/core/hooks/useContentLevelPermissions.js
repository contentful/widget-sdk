import { useAsync } from 'core/hooks';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { useCallback } from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const useContentLevelPermissions = () => {
  const { currentSpaceId, currentEnvironmentId, currentOrganizationId } = useSpaceEnvContext();

  const getContentLevelPermissionsEnabled = useCallback(
    () =>
      getVariation(FLAGS.CONTENT_LEVEL_PERMISSIONS, {
        spaceId: currentSpaceId,
        environmentId: currentEnvironmentId,
        organizationId: currentOrganizationId,
      }),
    [currentSpaceId, currentEnvironmentId, currentOrganizationId]
  );
  const { isLoading, data } = useAsync(getContentLevelPermissionsEnabled);
  return { contentLevelPermissionsLoading: isLoading, contentLevelPermissionsEnabled: !!data };
};

export { useContentLevelPermissions };
