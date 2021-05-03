import {
  createOnErrorWithInterceptor,
  createDefaultBatchClient,
  createInternalMethods,
} from '@contentful/experience-cma-utils';
import { useMemo } from 'react';
import { createClient } from 'contentful-management';
import type { PlainClientDefaultParams } from 'contentful-management';
import * as auth from 'Authentication';
import { captureError } from 'core/monitoring';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getDefaultHeaders } from './getDefaultClientHeaders';
import { getHostParams } from './getHostParams';
import { requestLogger, responseLogger } from './plainClientLogger';
import { getSpaceContext } from 'classes/spaceContext';

export type BatchedPlainCmaClient = ReturnType<typeof getCMAClient>;

type GetCmaClientOptions = { noBatch?: boolean };
export function getCMAClient(defaults?: PlainClientDefaultParams, options?: GetCmaClientOptions) {
  const client = createClient(
    {
      ...getHostParams(),
      accessToken: () => {
        return auth.getToken();
      },
      requestLogger,
      responseLogger,
      headers: getDefaultHeaders(),
      onError: createOnErrorWithInterceptor({
        refreshToken: async () => {
          const token = await auth.refreshToken();
          return token || '';
        },
        captureException: (error) => {
          captureError(error);
        },
      }),
    },
    { type: 'plain', defaults }
  );

  const batchClient = options?.noBatch
    ? undefined
    : createDefaultBatchClient(client, {
        onError: (error, context) => {
          captureError(error, { extra: { context } });
        },
      });

  const internal = createInternalMethods(client.raw);

  return {
    ...client,
    ...batchClient,
    internal,
  };
}

export function getSpaceEnvCMAClient() {
  const spaceContext = getSpaceContext();
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getAliasId() || spaceContext.getEnvironmentId();
  return getCMAClient({ environmentId: environmentId, spaceId });
}

export function useCMAClient() {
  return { CMAClient: getCMAClient() };
}

export function useSpaceEnvCMAClient(options?: GetCmaClientOptions) {
  const { currentEnvironmentId, currentSpaceId, currentEnvironmentAliasId } = useSpaceEnvContext();
  const resolvedEnvironmentId = currentEnvironmentAliasId || currentEnvironmentId;

  const spaceEnvCMAClient = useMemo(() => {
    return getCMAClient({ spaceId: currentSpaceId, environmentId: resolvedEnvironmentId }, options);
  }, [resolvedEnvironmentId, currentSpaceId, options]);

  return {
    spaceEnvCMAClient,
  };
}
