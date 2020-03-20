import { RequestOptions, Query } from '@pact-foundation/pact-web';

const severalEntriesBody = require('../fixtures/responses/entries-several.json');
const severalAssetsBody = require('../fixtures/responses/assets-several.json');
const severalContentTypesBody = require('../fixtures/responses/content-types-several.json');

export const defaultSpaceId = Cypress.env('spaceId');
export const defaultOrgId = Cypress.env('orgId');
export const defaultContentType = severalContentTypesBody.items[0];
export const defaultContentTypeId = defaultContentType.sys.id;
export const defaultEnvironmentId = 'master';
export const defaultEntry = severalEntriesBody.items[2];
export const defaultEntryId = defaultEntry.sys.id;
export const defaultAsset = severalAssetsBody.items[0];
export const defaultAssetId = defaultAsset.sys.id;
export const defaultPreviewName = 'Test Name';
export const defaultPreviewDescription = 'Test Description';
export const defaultPreviewId = '0xi0FU6rvrUVlJtPFuaUyl';
export const defaultHeader = {
  Accept: 'application/json, text/plain, */*',
  Authorization: 'Bearer CFAKE-140669ab83d2054794726a0372c87449841a876376f4de9369d856b098eda921',
};
export const defaultUserId = '1AMbGlddLG0ISEoa1I423p';
export const defaultJobId = 'jobID';
export const defaultWebhookId = 'webhookId';

export function getEntries(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries`,
    headers: defaultHeader,
    query,
  };
}
