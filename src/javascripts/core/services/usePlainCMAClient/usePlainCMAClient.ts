import { createDefaultBatchClient, createInternalMethods } from '@contentful/experience-cma-utils';
import { useMemo } from 'react';
import type { PlainClientDefaultParams } from 'contentful-management';
import { createClient } from 'contentful-management';
import * as auth from 'Authentication';
import { captureError } from 'core/monitoring';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getDefaultHeaders } from './getDefaultClientHeaders';
import { getHostParams } from './getHostParams';
import { makeRequest } from 'data/Request';
import { getSpaceContext } from 'classes/spaceContext';

export type BatchedPlainCmaClient = ReturnType<typeof getCMAClient>;
type GetCmaClientOptions = { noBatch?: boolean };

export function getCMAClient(defaults?: PlainClientDefaultParams, options?: GetCmaClientOptions) {
  const request = makeRequest({
    auth,
    clientName: 'cma',
    overrideDefaultResponseTransform: undefined,
  });

  /*
   `accessToken` and `refreshToken` is only for interface completeness,
   the accessToken is always set inside the adapter
   */
  const client = createClient(
    {
      ...getHostParams(),
      accessToken: () => {
        return auth.getToken();
      },
      headers: getDefaultHeaders(),
      retryOnError: false,
      onError: (error) => {
        captureError(error);
        throw error;
      },
      adapter: async (config) => {
        let body;

        if (config.data) {
          try {
            body = JSON.parse(config.data);
          } catch (error) {
            captureError(error);
          }
        }

        return request({
          headers: config.headers,
          method: config.method?.toUpperCase(),
          body: body,
          url: `${config.baseURL}${config.url}`,
          query: config.params,
        });
      },
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
