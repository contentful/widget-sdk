import { Client } from '@contentful/pubsub-subscriber';
import { apiUrl, pusher } from 'Config';
import { getToken } from 'Authentication';

export const ENVIRONMENT_ALIAS_CHANGED_EVENT = 'environment-alias-changed';
export const ENVIRONMENT_CREATION_COMPLETE_EVENT = 'environment-creation-complete';

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

  /*
    The original spaceClient causes an error when passed to JSON.stringify
    Since we pass the client via the Angular spaceContext, Angular invokes that behind the scenes for the digest cycle.
    That causes it to error.

    In order to fix this, we wrap the client in an object that serializes cleanly.
    This can all be removed once there is a state management solution that is not based on Angular.
  */
  const serializableClient = {
    on(...args) {
      return spaceClient.on(...args);
    },
    off(...args) {
      return spaceClient.off(...args);
    }
  };

  return serializableClient;
}
