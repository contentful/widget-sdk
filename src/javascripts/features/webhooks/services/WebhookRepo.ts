import { get as getAtPath, cloneDeep } from 'lodash';
import type { PlainClientAPI } from 'contentful-management';
import type { WebhookProps } from 'contentful-management/types';

export function createWebhookRepo({ client }: { client: PlainClientAPI }) {
  const logs = { getCall, getCalls, getHealth };
  return { getAll, get, save, remove, logs, hasValidBodyTransformation };

  function getAll() {
    return client.webhook.getMany({ query: { limit: 100 } }).then((response) => {
      return response.items.map(stringifyBodyTransformation);
    });
  }

  function get(webhookDefinitionId: string) {
    return client.webhook
      .get({ webhookDefinitionId })
      .then((data) => stringifyBodyTransformation(data));
  }

  function getCall(webhookDefinitionId: string, callId: string) {
    return client.webhook.getCallDetails({ webhookDefinitionId, callId });
  }

  function getCalls(webhookDefinitionId: string) {
    return client.webhook
      .getManyCallDetails({
        webhookDefinitionId,
        query: { limit: 500 },
      })
      .then((res) => res.items);
  }

  function getHealth(webhookDefinitionId: string) {
    return client.webhook.getHealthStatus({ webhookDefinitionId });
  }

  function save(webhook) {
    webhook = parseBodyTransformation(cloneDeep(webhook));
    return createOrUpdate(webhook).then(stringifyBodyTransformation);
  }

  function createOrUpdate(webhook: WebhookProps) {
    const webhookDefinitionId = getAtPath(webhook, ['sys', 'id']);

    if (webhookDefinitionId) {
      return client.webhook.update({ webhookDefinitionId }, webhook);
    } else {
      return client.webhook.create({}, webhook);
    }
  }

  function remove(webhook: WebhookProps) {
    return client.webhook.delete({ webhookDefinitionId: webhook.sys.id });
  }

  function stringifyBodyTransformation(webhook) {
    const bodyTransformation = getBodyTransformation(webhook);

    if (typeof bodyTransformation !== 'undefined') {
      webhook.transformation.body = JSON.stringify(bodyTransformation, null, 2);
    }

    return webhook;
  }

  function parseBodyTransformation(webhook) {
    const bodyTransformation = getBodyTransformation(webhook);

    if (typeof bodyTransformation === 'string') {
      webhook.transformation.body = JSON.parse(bodyTransformation);
    }

    return webhook;
  }

  function hasValidBodyTransformation(webhook) {
    const bodyTransformation = getBodyTransformation(webhook);

    if (typeof bodyTransformation === 'undefined') {
      return true;
    }

    if (typeof bodyTransformation === 'string') {
      try {
        JSON.parse(bodyTransformation);
        return true;
      } catch (err) {
        /* ignore */
      } // eslint-disable-line no-empty
    }

    return false;
  }

  function getBodyTransformation(webhook) {
    return getAtPath(webhook, ['transformation', 'body']);
  }
}
