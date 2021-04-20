import { useMemo } from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';

/**
 * A React hook that creates a conditionally scoped space endpoint.
 * The endpoint uses the environment-scoped route only for non-master routes
 */
export const useSpaceEnvEndpoint = () => {
  const { currentSpaceId = '', currentEnvironmentId, currentEnvironment } = useSpaceEnvContext();

  let environmentId;
  if (!isMasterEnvironment(currentEnvironment)) {
    // If the environment is not master, the scoped environment path is used
    environmentId = currentEnvironmentId;
  }

  return useMemoizedEndpoint(currentSpaceId, environmentId);
};

const useMemoizedEndpoint = (spaceId: string, environmentId: string | null = null) => {
  return useMemo(() => createSpaceEndpoint(spaceId, environmentId), [spaceId, environmentId]);
};
