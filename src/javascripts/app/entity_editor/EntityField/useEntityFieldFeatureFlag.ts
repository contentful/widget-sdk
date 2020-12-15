import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { useState, useEffect } from 'react';

export const useMigratedEntityField = () => {
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const { currentOrganizationId, currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  useEffect(() => {
    const init = async () => {
      const isEnabled = await getVariation(FLAGS.NEW_ENTITY_FIELD, {
        organizationId: currentOrganizationId,
        spaceId: currentSpaceId,
        environmentId: currentEnvironmentId,
      });
      setIsFeatureEnabled(isEnabled);
    };
    init();
  }, [currentEnvironmentId, currentOrganizationId, currentSpaceId]);

  return isFeatureEnabled;
};
