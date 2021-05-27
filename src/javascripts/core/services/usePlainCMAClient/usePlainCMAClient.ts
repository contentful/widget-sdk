import { createDefaultBatchClient, createInternalMethods } from '@contentful/experience-cma-utils';
import { useMemo } from 'react';
import type { PlainClientDefaultParams } from 'contentful-management';
import { createClient } from 'contentful-management';
import { getToken, refreshToken } from 'Authentication';
import { captureError } from 'core/monitoring';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getDefaultHeaders } from './getDefaultClientHeaders';
import { getHostParams } from './getHostParams';
import { makeRequest } from 'data/Request';
import { getSpaceContext } from 'classes/spaceContext';
import { axiosTransformResponse } from 'data/responseTransform';
import { createAdapter } from './adapter';
import { Source } from 'i13n/constants';

export type BatchedPlainCmaClient = ReturnType<typeof getCMAClient>;
type GetCmaClientOptions = { noBatch?: boolean; source?: Source };

const handleError = (error: Error, context?: any) => {
  const { status } = error['response'];
  if (status !== 429) {
    captureError(error, { extra: { context } });
  }
  throw error;
};

export function getCMAClient(defaults?: PlainClientDefaultParams, options?: GetCmaClientOptions) {
  const request = makeRequest({
    auth: {
      getToken,
      refreshToken,
    },
    source: options?.source,
    clientName: 'contentful-management',
    overrideDefaultResponseTransform: axiosTransformResponse,
  });
  /*
   `accessToken` and `refreshToken` is only for interface completeness,
   the accessToken is always set inside the adapter
   */
  const client = createClient(
    {
      ...getHostParams(),
      accessToken: () => getToken(),
      headers: getDefaultHeaders(),
      adapter: createAdapter(request),
      retryOnError: false,
      onError: handleError,
    },
    { type: 'plain', defaults }
  );

  const batchClient = options?.noBatch ? undefined : createDefaultBatchClient(client);

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
  return getCMAClient({ environmentId, spaceId });
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
