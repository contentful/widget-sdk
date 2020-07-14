import { Client, SpaceClient } from '@contentful/pubsub-subscriber';
import { apiUrl, pusher } from 'Config';
import { getToken } from 'Authentication';
import { Payloads } from '@contentful/pubsub-types';

export type PubSubClient = {
  on: SpaceClient['on'];
  off: SpaceClient['off'];
};
type Handler<T> = (ctx: T) => void;

export const ENVIRONMENT_ALIAS_CHANGED_EVENT = 'environment-alias-changed';
export const ENVIRONMENT_CREATION_COMPLETE_EVENT = 'environment-creation-complete';
export const ASSET_PROCESSING_FINISHED_EVENT = 'asset-processing-finished';
export const CONTENT_ENTITY_UPDATED_EVENT = 'content-entity-updated';

// make sure the client is initialized only once
const client = (async () => {
  const { cluster, appKey, endpoint } = pusher;
  const accessToken = await getToken();
  const authEndpoint = apiUrl(endpoint);
  return new Client({
    cluster,
    appKey,
    authEndpoint,
    accessToken,
  });
})();

export async function createPubSubClientForSpace(spaceId: string) {
  const spaceClient = (await client).forSpace(spaceId);

  /*
    The original spaceClient causes an error when passed to JSON.stringify
    Since we pass the client via the Angular spaceContext, Angular invokes that behind the scenes for the digest cycle.
    That causes it to error.

    In order to fix this, we wrap the client in an object that serializes cleanly.
    This can all be removed once there is a state management solution that is not based on Angular.
  */
  return {
    on<Topic extends keyof Payloads>(topic: Topic, handler: Handler<Payloads[Topic]>) {
      return spaceClient.on(topic, handler);
    },
    off<Topic extends keyof Payloads>(topic: Topic, handler?: Handler<Payloads[Topic]>) {
      return spaceClient.off(topic, handler);
    },
  };
}
