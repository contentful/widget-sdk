import { RequestOptions, Query } from '@pact-foundation/pact-web';
const severalEntriesBody = require('../fixtures/responses/entries-several.json');
const severalAssetsBody = require('../fixtures/responses/assets-several.json');
const severalContentTypesBody = require('../fixtures/responses/content-types-several.json');

export const defaultSpaceId = Cypress.env('spaceId');
export const defaultOrgId = Cypress.env('orgId');
export const defaultContentType = severalContentTypesBody.items[0]
export const defaultContentTypeId = defaultContentType.sys.id;
export const defaultEnvironment = 'master';
export const defaultEntry = severalEntriesBody.items[2];
export const defaultEntryId = defaultEntry.sys.id;
export const defaultAsset = severalAssetsBody.items[0]
export const defaultAssetId = defaultAsset.sys.id;
export const defaultPreviewName = 'Test Name';
export const defaultPreviewDescription = 'Test Description';
export const defaultPreviewId = '0xi0FU6rvrUVlJtPFuaUyl';
export const defaultHeader = {
  Accept: 'application/json, text/plain, */*'
};
export const defaultTaskId = 'taskId1';
export const defaultUserId = 'userID';
export const defaultJobId = 'jobID';
export const defaultWebhookId = 'webhookId';

export function getEnforcements(spaceId: string = defaultSpaceId): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/enforcements`,
    headers: defaultHeader
  };
}

export function getExtensions(spaceId: string = defaultSpaceId): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/extensions`,
    headers: defaultHeader
  };
}

export function getEntries(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries`,
    headers: defaultHeader,
    query
  };
}

export function getEntriesWithEnvironment(
  spaceId: string = defaultSpaceId,
  environmentId: string = defaultEnvironment,
  query?: Query
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/environments/${environmentId}/entries`,
    headers: defaultHeader,
    query
  };
}

export function getEntry(
  spaceId: string = defaultSpaceId,
  entryId: string = defaultEntryId
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries/${entryId}`,
    headers: defaultHeader
  };
}

export function getEntryLinks(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries`,
    headers: defaultHeader,
    query
  };
}

export function getEntrySnapshots(
  spaceId: string = defaultSpaceId,
  entryId: string = defaultEntryId,
  query?: Query
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries/${entryId}/snapshots`,
    headers: defaultHeader,
    query
  };
}

export function postEntry(spaceId: string = defaultSpaceId): RequestOptions {
  return {
    method: 'POST',
    path: `/spaces/${spaceId}/entries`,
    headers: defaultHeader
  };
}

export function getEnvironments(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/environments`,
    headers: defaultHeader,
    query
  };
}

export function getLocales(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/locales`,
    headers: defaultHeader,
    query
  };
}

export function postStreamToken(): RequestOptions {
  return {
    method: 'POST',
    path: `/_microbackends/backends/streamtoken/generate`,
    headers: {}
  };
}

export function getPreviewEnvironments(
  spaceId: string = defaultSpaceId,
  query?: Query
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/preview_environments`,
    headers: defaultHeader,
    query
  };
}

export function getOrgProductCatalogFeatures(orgId: string = defaultOrgId): RequestOptions {
  return {
    method: 'GET',
    path: `/organizations/${orgId}/product_catalog_features`,
    headers: defaultHeader
  };
}

export function getSpaceProductCatalogFeatures(
  spaceId: string = defaultSpaceId,
  query?: Query
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/product_catalog_features`,
    headers: defaultHeader,
    query
  };
}

export function getEntryJobs(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/environments/master/jobs`,
    headers: { ...defaultHeader, 'x-contentful-enable-alpha-feature': 'scheduled-jobs' },
    query
  };
}

export function cancelJob(
  spaceId: string = defaultSpaceId,
  jobId: string = defaultJobId
): RequestOptions {
  return {
    method: 'DELETE',
    path: `/spaces/${spaceId}/environments/master/jobs/${jobId}`,
    headers: { ...defaultHeader, 'x-contentful-enable-alpha-feature': 'scheduled-jobs' }
  };
}

export function getEntryCommentsAndTasks(
  spaceId: string = defaultSpaceId,
  entryId: string = defaultEntryId
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries/${entryId}/comments`,
    headers: defaultHeader
  };
}

export function postEntryTask(
  spaceId: string = defaultSpaceId,
  entryId: string = defaultEntryId,
  task: Object
): RequestOptions {
  return {
    method: 'POST',
    path: `/spaces/${spaceId}/entries/${entryId}/comments`,
    headers: defaultHeader,
    body: task
  };
}

export function putEntryTask(
  spaceId: string = defaultSpaceId,
  entryId: string = defaultEntryId,
  taskId: string = defaultTaskId,
  task: Object
): RequestOptions {
  return {
    method: 'PUT',
    path: `/spaces/${spaceId}/entries/${entryId}/comments/${taskId}`,
    headers: defaultHeader,
    body: task
  }
}


export function getSpaceUsers(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/users`,
    headers: defaultHeader,
    query
  };
}

export function getOrgUsers(orgId: string = defaultOrgId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/organizations/${orgId}/users`,
    headers: defaultHeader,
    query
  };
}

export function getWebhooks(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/webhook_definitions`,
    headers: defaultHeader,
    query
  };
}

export function getWebhook(
  spaceId: string = defaultSpaceId,
  webhookId: string = defaultWebhookId
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/webhook_definitions/${webhookId}`,
    headers: defaultHeader
  };
}

export function getWebhooksCallsState(
  spaceId: string = defaultSpaceId,
  webhookId: string = defaultWebhookId
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/webhooks/${webhookId}/health`,
    headers: defaultHeader
  };
}

export function postWebhook(spaceId: string = defaultSpaceId, body?: Object): RequestOptions {
  return {
    method: 'POST',
    path: `/spaces/${spaceId}/webhook_definitions`,
    headers: defaultHeader,
    body
  };
}

export function getWebhookCalls(
  spaceId: string = defaultSpaceId,
  webhookId: string = defaultWebhookId,
  query?: Query
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/webhooks/${webhookId}/calls`,
    headers: defaultHeader,
    query
  };
}

export function deleteWebhook(
  spaceId: string = defaultSpaceId,
  webhookId: string = defaultWebhookId
): RequestOptions {
  return {
    method: 'DELETE',
    path: `/spaces/${spaceId}/webhook_definitions/${webhookId}`,
    headers: defaultHeader
  };
}
