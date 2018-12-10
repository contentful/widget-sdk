import { get, cloneDeep } from 'lodash';

import spaceContext from 'spaceContext';

const UNINDEXABLE_FIELD_TYPES = ['Object', 'Array', 'Link', 'Location'];

const makeError = msg => {
  const err = new Error(msg);
  err.useMessage = true;
  return err;
};

export async function create(rawContext) {
  const context = prepareAndValidateContext(rawContext);

  const publishWebhook = makePublishWebhook(context);
  const unpublishWebhook = makeUnpublishWebhook(context);

  const webhooks = await Promise.all([
    spaceContext.webhookRepo.save(publishWebhook),
    spaceContext.webhookRepo.save(unpublishWebhook)
  ]);

  return {
    ...context.config,
    webhookIds: webhooks.map(w => w.sys.id)
  };
}

export async function update(rawContext) {
  const context = prepareAndValidateContext(rawContext);

  const spaceWebhooks = await spaceContext.webhookRepo.getAll();

  const webhooksToUpdate = (context.config.webhookIds || []).reduce((acc, id) => {
    const webhook = spaceWebhooks.find(w => w.sys.id === id);
    return webhook ? acc.concat([webhook]) : acc;
  }, []);

  if (webhooksToUpdate.length !== 2) {
    throw new Error('Webhooks to update not found.');
  }

  const publishWebhook = makePublishWebhook(context);
  publishWebhook.sys = get(webhooksToUpdate[0], ['sys'], {});
  publishWebhook.headers = get(webhooksToUpdate[0], ['headers'], {});

  const unpublishWebhook = makeUnpublishWebhook(context);
  unpublishWebhook.sys = get(webhooksToUpdate[1], ['sys'], {});
  unpublishWebhook.headers = get(webhooksToUpdate[1], ['headers'], {});

  const webhooks = await Promise.all([
    spaceContext.webhookRepo.save(publishWebhook),
    spaceContext.webhookRepo.save(unpublishWebhook)
  ]);

  return {
    ...context.config,
    webhookIds: webhooks.map(w => w.sys.id)
  };
}

export async function remove({ config }) {
  const spaceWebhooks = await spaceContext.webhookRepo.getAll();
  const webhookIds = Array.isArray(config.webhookIds) ? config.webhookIds : [];

  const webhooksToRemove = webhookIds.reduce((acc, id) => {
    const webhook = spaceWebhooks.find(w => w.sys.id === id);
    return webhook ? acc.concat([webhook]) : acc;
  }, []);

  const removalPromises = webhooksToRemove.map(webhook => {
    return spaceContext.webhookRepo.remove(webhook);
  });

  try {
    await Promise.all(removalPromises);
  } catch (err) {
    // Failed to remove some webhooks. We can live with that.
  }
}

function prepareAndValidateContext(context) {
  context = cloneDeep(context);
  context.apiKey = (context.apiKey || '').trim();

  const { config } = context;
  config.appId = (config.appId || '').trim();
  config.index = (config.index || '').trim();

  if (!config.appId) {
    throw makeError('Provide Algolia Application ID.');
  }

  if (!context.apiKey && !context.installed) {
    throw makeError('Provide Algolia API Key.');
  }

  const contentType = (context.contentTypes || []).find(ct => {
    return ct.sys.id === config.contentTypeId;
  });

  if (!contentType) {
    throw makeError('Select a content type.');
  }

  const fields = (contentType.fields || []).filter(field => {
    return !UNINDEXABLE_FIELD_TYPES.includes(field.type);
  });

  if (fields.length < 1) {
    throw makeError(`${contentType.name} has no indexable fields.`);
  }

  if (!config.index) {
    throw makeError('Provide Algolia index name.');
  }

  const locale = (context.locales || []).find(l => l.code === config.localeCode);
  if (!locale) {
    throw makeError('Select a locale.');
  }

  return { ...context, contentType, fields };
}

function makePublishWebhook({ apiKey, config, contentType, fields }) {
  const customBody = fields.reduce((acc, field) => {
    const id = field.apiName || field.id;
    return { ...acc, [id]: `{ /payload/fields/${id}/${config.localeCode} }` };
  }, {});

  return {
    name: `Index ${contentType.name} (Algolia app)`,
    url: `https://${config.appId}.algolia.net/1/indexes/${config.index}/{ /payload/sys/id }`,
    topics: ['Entry.publish'],
    filters: [
      { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
      { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.sys.id] }
    ],
    headers: [
      { key: 'X-Algolia-Application-Id', value: config.appId },
      { key: 'X-Algolia-API-Key', value: apiKey, secret: true }
    ],
    transformation: {
      method: 'PUT',
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(customBody)
    }
  };
}

function makeUnpublishWebhook({ apiKey, config, contentType }) {
  return {
    name: `Delete ${contentType.name} from index (Algolia app)`,
    url: `https://${config.appId}.algolia.net/1/indexes/${config.index}/{ /payload/sys/id }`,
    topics: ['Entry.unpublish'],
    filters: [
      { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
      { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.sys.id] }
    ],
    headers: [
      { key: 'X-Algolia-Application-Id', value: config.appId },
      { key: 'X-Algolia-API-Key', value: apiKey, secret: true }
    ],
    transformation: { method: 'DELETE' }
  };
}
