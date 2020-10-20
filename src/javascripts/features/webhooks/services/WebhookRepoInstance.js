import { createWebhookRepo } from './WebhookRepo';

const perSpaceCache = {};

export function getWebhookRepo({ spaceId, space }) {
  if (!perSpaceCache[spaceId]) {
    perSpaceCache[spaceId] = createWebhookRepo(space);
  }

  return perSpaceCache[spaceId];
}
