import { createOnErrorWithInterceptor } from '@contentful/experience-cma-utils';
import { useMemo } from 'react';
import { createClient } from 'contentful-management';
import type { PlainClientDefaultParams } from 'contentful-management';
import * as auth from 'Authentication';
import * as logger from 'services/logger';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getDefaultHeaders } from './getDefaultClientHeaders';
import { getHostParams } from './getHostParams';

export function getCMAClient(defaults?: PlainClientDefaultParams) {
  return createClient(
    {
      ...getHostParams(),
      accessToken: () => {
        return auth.getToken();
      },
      headers: getDefaultHeaders(),
      onError: createOnErrorWithInterceptor({
        refreshToken: async () => {
          const token = await auth.refreshToken();
          return token || '';
        },
        captureException: (error) => {
          logger.logException(error, {});
        },
      }),
    },
    { type: 'plain', defaults }
  );
}

export function useCMAClient() {
  return { CMAClient: getCMAClient() };
}

export function useSpaceEnvCMAClient() {
  const { currentEnvironmentId, currentSpaceId } = useSpaceEnvContext();

  const spaceEnvCMAClient = useMemo(() => {
    return getCMAClient({ spaceId: currentSpaceId, environmentId: currentEnvironmentId });
  }, [currentEnvironmentId, currentSpaceId]);

  return {
    spaceEnvCMAClient,
  };
}
