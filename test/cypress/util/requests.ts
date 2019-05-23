import { RequestOptions, Query } from '@pact-foundation/pact-web';

export const defaultSpaceId = Cypress.env('spaceId');
export const defaultOrgId = Cypress.env('orgId');
export const defaultContentTypeId = 'testContentType';
export const defaultEnvironment = 'master';
export const defaultEntryId = 'testEntryId';
export const defaultPreviewName = 'Test Name';
export const defaultPreviewDescription = 'Test Description';
export const defaultPreviewId = '0xi0FU6rvrUVlJtPFuaUyl';
export const defaultHeader = {
  Accept: 'application/json, text/plain, */*'
};
export const defaultUserId = 'userID';

export function getPublicContentTypes(
  spaceId: string = defaultSpaceId,
  query?: Query
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/public/content_types`,
    headers: defaultHeader,
    query
  };
}

export function getContentTypes(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/content_types`,
    headers: defaultHeader,
    query
  };
}

export function getContentType(
  contentTypeId: string = defaultContentTypeId,
  spaceId: string = defaultSpaceId
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/content_types/${contentTypeId}`,
    headers: defaultHeader
  };
}

export function getContentTypePublished(
  contentTypeId: string = defaultContentTypeId,
  spaceId: string = defaultSpaceId
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/content_types/${contentTypeId}/published`,
    headers: defaultHeader
  };
}

export function getEditorInterface(
  contentTypeId: string = defaultContentTypeId,
  spaceId: string = defaultSpaceId
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/content_types/${contentTypeId}/editor_interface`,
    headers: defaultHeader
  };
}

export function getEnforcements(spaceId: string = defaultSpaceId): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/enforcements`,
    headers: defaultHeader
  };
}

export function getExtensions(
  spaceId: string = defaultSpaceId,
  environmentId: string = defaultEnvironment
): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/environments/${environmentId}/extensions`,
    headers: defaultHeader
  };
}

export function getAssets(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/assets`,
    headers: defaultHeader,
    query
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

export function getApps(spaceId: string = defaultSpaceId): RequestOptions {
  return {
    method: 'GET',
    path: `/_microbackends/backends/apps/spaces/${spaceId}/`,
    headers: {}
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

export function getSpaceProductCatalogFeatures(spaceId: string = defaultSpaceId): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/product_catalog_features`,
    headers: defaultHeader
  };
}

export function getEntryJobs(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/jobs`,
    headers: { ...defaultHeader, 'x-contentful-enable-alpha-feature': 'jobs' },
    query
  };
}

export function getUsers(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/users`,
    headers: defaultHeader,
    query
  };
}
