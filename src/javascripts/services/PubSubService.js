import { Client } from '@contentful/pubsub-subscriber';
import { apiUrl, pusher } from 'Config';
import { getToken } from 'Authentication';
import * as logger from 'services/logger';

export const ENVIRONMENT_ALIAS_CHANGED_EVENT = 'environment-alias-changed';

// make sure the client is initialized only once
const client = (async () => {
  const { cluster, appKey, endpoint } = pusher;
  const accessToken = await getToken();
  const authEndpoint = apiUrl(endpoint);
  return new Client({
    cluster,
    appKey,
    authEndpoint,
    accessToken
  });
})();

/**
 * Create a pubsub client for a specific spaceId
 *
 * @param {string} spaceId
 * @returns {SpaceClient}
 */
export async function createPubSubClientForSpace(spaceId) {
  const spaceClient = (await client).forSpace(spaceId);
  spaceClient.onError(logger.logError);
  return spaceClient;
}
