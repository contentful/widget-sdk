import { cloneDeep } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

export const UNINDEXABLE_FIELD_TYPES = ['Object', 'Array', 'Link', 'Location'];
export const META_FIELDS = [
  { id: '_entryId_', title: '{Entry Id}', transformPath: '/payload/sys/id' },
  {
    id: '_contentTypeId_',
    title: '{Content Type}',
    transformPath: '/payload/sys/contentType/sys/id'
  }
];

export async function create(rawContext) {
  const context = cloneDeep(rawContext);
  const [, config] = getValidatedOptions(context);
  const savedRecords = await Promise.all(config.records.map(record => saveRecord(record, context)));

  return {
    ...config,
    records: savedRecords.filter(isValidRecord).map(sanitizeRecord)
  };
}

export async function update(rawContext) {
  const context = cloneDeep(rawContext);
  const [, config] = getValidatedOptions(context);
  const savedRecords = await Promise.all(config.records.map(record => saveRecord(record, context)));

  return {
    ...config,
    records: savedRecords.filter(isValidRecord).map(sanitizeRecord)
  };
}

function createPublishWebhook(record, context) {
  const contentType = findContentTypeById(record.contentTypeId, context);

  return {
    name: `Algolia App: Index ${contentType.name} (${record.localeCode})`,
    url: `https://${context.config.appId}.algolia.net/1/indexes/${
      record.index
    }/{ /payload/sys/id }`,
    topics: ['Entry.publish'],
    filters: [
      { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
      { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.sys.id] }
    ],
    headers: [
      { key: 'X-Algolia-Application-Id', value: context.config.appId },
      { key: 'X-Algolia-API-Key', value: context.apiKey, secret: true }
    ],
    transformation: {
      method: 'PUT',
      contentType: 'application/json; charset=utf-8',
      body: createTransform(record, context)
    }
  };
}

function createUnpublishWebhook(record, context) {
  const contentType = findContentTypeById(record.contentTypeId, context);

  return {
    name: `Algolia App: Delete ${contentType.name} (${record.localeCode})`,

    url: `https://${context.config.appId}.algolia.net/1/indexes/${
      record.index
    }/{ /payload/sys/id }`,
    topics: ['Entry.unpublish'],
    filters: [
      { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
      { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.sys.id] }
    ],
    headers: [
      { key: 'X-Algolia-Application-Id', value: context.config.appId },
      { key: 'X-Algolia-API-Key', value: context.apiKey, secret: true }
    ],
    transformation: { method: 'DELETE' }
  };
}

function createTransform(record, context) {
  const fields = record.fields.default
    ? getAllDefaultFieldsOf(record, context)
    : record.fields.custom;

  const withMetaFields = fields.concat(META_FIELDS);

  const transform = {};
  withMetaFields.forEach(field => {
    transform[field.id] = createTransformField(field, record, context);
  });

  return JSON.stringify(transform, null, '\t');
}

function createTransformField(field, record) {
  if (field.transformPath) {
    return `{ ${field.transformPath} }`;
  }

  if (field.helper && field.helperParameter) {
    return `{ ${field.helper} ${field.helperParameter} /payload/fields/${field.id}/${
      record.localeCode
    } }`;
  } else if (field.helper) {
    return `{ ${field.helper} /payload/fields/${field.id}/${record.localeCode} }`;
  }

  return `{ /payload/fields/${field.id}/${record.localeCode} }`;
}

function getAllDefaultFieldsOf(record, context) {
  return findContentTypeById(record.contentTypeId, context)
    .fields.filter(field => !UNINDEXABLE_FIELD_TYPES.includes(field.type))
    .map(field => {
      return {
        id: field.apiName || field.id
      };
    });
}

function getValidatedOptions(context) {
  const apiKey = context.apiKey ? context.apiKey.trim() : undefined;
  const config = context.config;
  config.appId = config.appId.trim();

  if (!config.appId) throwError('Algolia App ID is required');
  // if (!apiKey) throwError('Algolia API Key is required')

  if (config.records.length === 0) {
    throwError('At least one content <> index pair needs to be selected');
  }

  config.records = config.records.map(e => getValidatedRecord(e, context));

  return [apiKey, config];
}

function getValidatedRecord(rawRecord, context) {
  const record = cloneDeep(rawRecord);
  record.index = record.index.trim();
  record.localeCode = record.localeCode.trim();
  record.contentTypeId = record.contentTypeId.trim();

  if (record.index === '') throwError(`Algolia index is missing for "${record.index}"`);
  if (!isValidLocaleCode(record.localeCode, context))
    throwError(`Bad locale selection for "${record.index}"`);

  if (!record.fields.default && record.fields.custom.length === 0)
    throwError(`At least one field is required for "${record.index}"`);

  if (record.index) return record;
}

function isValidLocaleCode(localeCode, context) {
  return context.allLocales.some(l => l.code === localeCode);
}

function isValidRecord(record) {
  return record && !record.deleted;
}

function findContentTypeById(contentTypeId, context) {
  return context.allContentTypes.find(ct => ct.sys.id === contentTypeId);
}

function findWebhookById(webhookId, context) {
  return context.allWebhooks.find(w => w.sys.id === webhookId);
}

async function saveRecord(record, context) {
  if (record.deleted) {
    await removeRecord(record, context);
    return;
  }

  const webhooks = await Promise.all([
    saveWebhook(createPublishWebhook(record, context), context, record.publishWebhookId),
    saveWebhook(createUnpublishWebhook(record, context), context, record.unpublishWebhookId)
  ]);

  return {
    ...record,
    publishWebhookId: webhooks[0].sys.id,
    unpublishWebhookId: webhooks[1].sys.id
  };
}

function saveWebhook(draftWebhook, context, existingWebhookId) {
  if (existingWebhookId) {
    const existing = findWebhookById(existingWebhookId, context);
    if (!existing) {
      throwError('Webhook to update not found');
    }

    draftWebhook.sys = existing.sys || {};
    draftWebhook.headers = existing.headers || {};
  }

  return spaceContext.webhookRepo.save(draftWebhook);
}

export async function remove(context) {
  const algoliaWebhookIds = [];
  context.config.records
    .filter(r => r)
    .forEach(record => {
      algoliaWebhookIds.push(record.publishWebhookId);
      algoliaWebhookIds.push(record.unpublishWebhookId);
    });

  const algoliaWebhooks = algoliaWebhookIds
    .map(id => findWebhookById(id, context))
    .filter(webhook => !!webhook);

  try {
    await Promise.all(algoliaWebhooks.map(wh => spaceContext.webhookRepo.remove(wh)));
  } catch (err) {
    // Failed to remove some webhooks. We can live with that.
  }
}

export async function removeRecord(record, context) {
  const algoliaWebhooks = [record.publishWebhookId, record.unpublishWebhookId]
    .map(id => findWebhookById(id, context))
    .filter(webhook => !!webhook);

  if (algoliaWebhooks.length === 0) return;

  try {
    await Promise.all(algoliaWebhooks.map(wh => spaceContext.webhookRepo.remove(wh)));
  } catch (err) {
    // Failed to remove some webhooks. We can live with that.
  }
}

export function sanitizeRecord(raw) {
  const record = { ...raw };
  delete record.deleted;
  delete record.updated;
  delete record.created;
  delete record.configIndex;
  delete record.isNewRecord;
  return record;
}

function throwError(msg) {
  const err = new Error(msg);
  err.useMessage = err;
  throw err;
}
