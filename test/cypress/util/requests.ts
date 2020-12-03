import { RequestOptions, Query } from '@pact-foundation/pact-web';
import constants from '../../constants';

const severalAssetsBody = require('../fixtures/responses/assets-several.json');
const severalContentTypesBody = require('../fixtures/responses/content-types-several.json');

export const defaultSpaceId = constants.spaceId;
export const defaultOrgId = constants.orgId;
export const defaultContentType = severalContentTypesBody.items[0];
export const defaultContentTypeId = defaultContentType.sys.id;
export const defaultEnvironmentId = 'master';
export const defaultEntryId = 'testEntryId';
export const defaultAsset = severalAssetsBody.items[0];
export const defaultAssetId = defaultAsset.sys.id;
export const defaultPreviewName = 'Test Name';
export const defaultPreviewDescription = 'Test Description';
export const defaultPreviewId = '0xi0FU6rvrUVlJtPFuaUyl';
export const defaultHeader = {
  Accept: 'application/json, text/plain, */*',
  Authorization: `Bearer ${constants.token}`,
};
export const defaultUserId = '1AMbGlddLG0ISEoa1I423p';
export const defaultJobId = 'jobID';
export const defaultWebhookId = 'webhookId';
export const defaultReleaseId = 'releaseId';
export const defaultReleaseActionId = 'releaseActionId';
export const defaultAppId = '6YdAwxoPHopeTeuwh43UJu';
export const appContentTypeId = 'dropboxTest';
export const entryIdWithApp = 'entryIdWithApp';

export function getEntries(spaceId: string = defaultSpaceId, query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${spaceId}/entries`,
    headers: defaultHeader,
    query,
  };
}
