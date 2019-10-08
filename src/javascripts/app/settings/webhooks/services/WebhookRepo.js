import { get as getAtPath, cloneDeep } from 'lodash';

export default function createWebhookRepo(space) {
  const logs = { getCall, getCalls, getHealth };
  return { getAll, get, save, remove, logs, hasValidBodyTransformation };

  function getAll() {
    return getBaseCall()
      .payload({ limit: 100 })
      .get()
      .then(res => res.items.map(stringifyBodyTransformation));
  }

  function get(id) {
    return getBaseCall(id)
      .get()
      .then(stringifyBodyTransformation);
  }

  function getCall(webhookId, callId) {
    return getLogsBaseCall(webhookId)
      .paths(['calls', callId])
      .get();
  }

  function getCalls(webhookId) {
    return getLogsBaseCall(webhookId)
      .paths(['calls'])
      .payload({ limit: 500 })
      .get()
      .then(res => res.items);
  }

  function getHealth(webhookId) {
    return getLogsBaseCall(webhookId)
      .paths(['health'])
      .get();
  }

  function save(webhook) {
    webhook = parseBodyTransformation(cloneDeep(webhook));
    return createOrUpdate(webhook).then(stringifyBodyTransformation);
  }

  function createOrUpdate(webhook) {
    const id = getAtPath(webhook, ['sys', 'id']);

    if (id) {
      return getBaseCall(id, webhook.sys.version)
        .payload(webhook)
        .put();
    } else {
      return getBaseCall()
        .payload(webhook)
        .post();
    }
  }

  function remove(webhook) {
    return getBaseCall(webhook.sys.id).delete();
  }

  function getBaseCall(id, version) {
    const headers = typeof version !== 'undefined' ? { 'X-Contentful-Version': version } : {};
    return space.endpoint('webhook_definitions', id).headers(headers);
  }

  function getLogsBaseCall(webhookId) {
    return space.endpoint('webhooks', webhookId);
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
