import { RequestOptions, Query } from '@pact-foundation/pact-web';
const severalEntriesBody = require('../fixtures/responses/entries-several.json');
const severalAssetsBody = require('../fixtures/responses/assets-several.json');
const severalContentTypesBody = require('../fixtures/responses/content-types-several.json');

export const defaultSpaceId = Cypress.env('spaceId');
export const defaultOrgId = Cypress.env('orgId');
export const defaultContentType = severalContentTypesBody.items[0]
export const defaultContentTypeId = defaultContentType.sys.id;
export const defaultEnvironmentId = 'master';
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

export function getEntries(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries`,
    headers: defaultHeader,
    query
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
