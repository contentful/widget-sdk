import { createWebhookRepo } from './WebhookRepo';
import { getCMAClient } from 'core/services/usePlainCMAClient';

export function getWebhookRepo({ spaceId }: { spaceId: string }) {
  const client = getCMAClient({ spaceId });
  return createWebhookRepo({ client });
}
