import {
  createOnErrorWithInterceptor,
  createDefaultBatchClient,
  createInternalMethods,
} from '@contentful/experience-cma-utils';
import { useMemo } from 'react';
import { createClient } from 'contentful-management';
import type { PlainClientDefaultParams } from 'contentful-management';
import * as auth from 'Authentication';
import * as logger from 'services/logger';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getDefaultHeaders } from './getDefaultClientHeaders';
import { getHostParams } from './getHostParams';

export type BatchedPlainCmaClient = ReturnType<typeof getCMAClient>;

export function getCMAClient(defaults?: PlainClientDefaultParams) {
  const client = createClient(
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
          logger.captureError(error);
        },
      }),
    },
    { type: 'plain', defaults }
  );

  const batchClient = createDefaultBatchClient(client, {
    onError: (error, context) => {
      logger.captureError(error, context);
    },
  });

  const internal = createInternalMethods(client.raw);

  return {
    ...client,
    ...batchClient,
    internal,
  };
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
