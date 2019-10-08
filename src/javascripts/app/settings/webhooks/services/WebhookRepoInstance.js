import { getModule } from 'NgRegistry.es6';
import createWebhookRepo from './WebhookRepo';

const perSpaceCache = {};

export function getWebhookRepo() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const space = spaceContext.getSpace();

  if (!perSpaceCache[spaceId]) {
    perSpaceCache[spaceId] = createWebhookRepo(space);
  }

  return perSpaceCache[spaceId];
}
