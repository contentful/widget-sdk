import { TagsRepoType } from 'features/content-tags';
import ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { CONTENT_ENTITY_UPDATED_EVENT, PubSubClient } from 'services/PubSubService';
import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import { SpaceAPI, User } from '@contentful/app-sdk';
import { InternalContentType, createContentTypeApi } from './createContentTypeApi';
import { get, noop } from 'lodash';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

const ASSET_PROCESSING_POLL_MS = 500;
const GET_WAIT_ON_ENTITY_UPDATE = 500;

/**
 * Makes a method throw an Exception when the API is read0only
 */
const makeReadOnlyGuardedMethod = (readOnly: boolean, method) => {
  return readOnly
    ? () => {
        throw makeReadOnlyApiError(ReadOnlyApi.Space, method?.name ?? method.toString());
      }
    : method;
};

interface EntityLink {
  sys: {
    type: 'Link';
    linkType: 'Entry' | 'Asset';
    id: string;
  };
}

// TODO: some of methods are only available in the Web App, not in the public SDK.
// In a long run all methods should be typed in the SDK and made public.
type InternalSpaceAPI = SpaceAPI & {
  getEntryReferences: (entryId: string) => Promise<any>;
  executeRelease: (action: string, entities: EntityLink[], type?: string) => Promise<any>;
  validateRelease: (action: string, entities: EntityLink[], type?: string) => Promise<any>;
  validateEntry: (data: any, version: number) => Promise<any>;
  signAssetUrls: (data: any) => Promise<any>;
  onEntityChanged: (
    entityType: string,
    entityId: string,
    callback: (value: any) => void
  ) => () => void;
};

export function createSpaceApi({
  cma,
  initialContentTypes,
  pubSubClient,
  environmentIds,
  spaceId,
  tagsRepo,
  usersRepo,
  readOnly = false,
  appId,
}: {
  cma: any;
  initialContentTypes: InternalContentType[];
  pubSubClient?: PubSubClient;
  environmentIds: string[];
  spaceId: string;
  tagsRepo: TagsRepoType;
  usersRepo: any;
  readOnly?: boolean;
  appId?: string;
}): InternalSpaceAPI {
  const spaceApi = {
    // Proxy directly to the CMA client:
    archiveEntry: makeReadOnlyGuardedMethod(readOnly, cma.archiveEntry),
    archiveAsset: makeReadOnlyGuardedMethod(readOnly, cma.archiveAsset),
    createContentType: makeReadOnlyGuardedMethod(readOnly, cma.createContentType),
    createEntry: makeReadOnlyGuardedMethod(readOnly, cma.createEntry),
    createAsset: makeReadOnlyGuardedMethod(readOnly, cma.createAsset),
    deleteAsset: makeReadOnlyGuardedMethod(readOnly, cma.deleteAsset),
    deleteContentType: makeReadOnlyGuardedMethod(readOnly, cma.deleteContentType),
    deleteEntry: makeReadOnlyGuardedMethod(readOnly, cma.deleteEntry),
    getAsset: cma.getAsset,
    getAssets: cma.getAssets,
    signAssetUrls: cma.signAssetUrls,
    getEditorInterface: cma.getEditorInterface,
    getEditorInterfaces: cma.getEditorInterfaces,
    getEntry: cma.getEntry,
    getEntrySnapshots: cma.getEntrySnapshots,
    getEntries: cma.getEntries,
    getContentType: cma.getContentType,
    getContentTypes: cma.getContentTypes,
    getPublishedEntries: cma.getPublishedEntries,
    getPublishedAssets: cma.getPublishedAssets,
    processAsset: makeReadOnlyGuardedMethod(readOnly, cma.processAsset),
    publishAsset: makeReadOnlyGuardedMethod(readOnly, cma.publishAsset),
    publishEntry: makeReadOnlyGuardedMethod(readOnly, cma.publishEntry),
    unarchiveAsset: makeReadOnlyGuardedMethod(readOnly, cma.unarchiveAsset),
    unarchiveEntry: makeReadOnlyGuardedMethod(readOnly, cma.unarchiveEntry),
    unpublishAsset: makeReadOnlyGuardedMethod(readOnly, cma.unpublishAsset),
    unpublishEntry: makeReadOnlyGuardedMethod(readOnly, cma.unpublishEntry),
    updateAsset: makeReadOnlyGuardedMethod(readOnly, cma.updateAsset),
    updateContentType: makeReadOnlyGuardedMethod(readOnly, cma.updateContentType),
    updateEntry: makeReadOnlyGuardedMethod(readOnly, cma.updateEntry),
    readTags: tagsRepo.readTags,
    createTag: makeReadOnlyGuardedMethod(readOnly, tagsRepo.createTag),
    deleteTag: makeReadOnlyGuardedMethod(readOnly, tagsRepo.deleteTag),
    updateTag: makeReadOnlyGuardedMethod(readOnly, tagsRepo.updateTag),

    // Implementation in this module:
    getCachedContentTypes,
    createUpload: makeReadOnlyGuardedMethod(readOnly, createUpload),
    getUsers,
    waitUntilAssetProcessed,
    getEntityScheduledActions: ScheduledActionsRepo.getEntityScheduledActions,
    getAllScheduledActions: ScheduledActionsRepo.getAllScheduledActions,

    // Only in internal SDK, not implemented in the public one
    getEntryReferences: cma.getEntryReferences,
    executeRelease: makeReadOnlyGuardedMethod(readOnly, cma.executeRelease),
    validateRelease: makeReadOnlyGuardedMethod(readOnly, cma.validateRelease),
    validateEntry: makeReadOnlyGuardedMethod(readOnly, cma.validateEntry),
    onEntityChanged,

    signRequest: makeReadOnlyGuardedMethod(readOnly, makeSignRequest(appId)),
  };

  return spaceApi;

  function makeSignRequest(appId) {
    return (req) => {
      if (!appId) {
        throw new Error('Can only sign request in app context');
      }
      return cma.signRequest(appId, req);
    };
  }

  function getCachedContentTypes() {
    return initialContentTypes.map(createContentTypeApi);
  }

  async function createUpload(base64Data: string) {
    // Convert raw Base64 string to Uint8Array so we can post the binary to upload API
    const raw = window.atob(base64Data);
    const rawLength = raw.length;
    const binary = new Uint8Array(new ArrayBuffer(rawLength));

    for (let i = 0; i < rawLength; i++) {
      binary[i] = raw.charCodeAt(i);
    }

    const token = await getToken();

    // We're preferring `fetch` over `createEndpoint` to be able to send binary data
    const response = await window.fetch(uploadApiUrl(`/spaces/${spaceId}/uploads`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${token}`,
      },
      body: binary,
    });

    return response.json();
  }

  async function getUsers() {
    const users = (await usersRepo.getAll()) ?? [];

    return {
      sys: { type: 'Array' },
      total: users.length,
      skip: 0,
      limit: users.length,
      items: users.map((user: User) => ({
        sys: { type: 'User', id: user.sys.id },
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      })),
    };
  }

  // Assets are processed asynchronously, so we have to poll the asset endpoint to wait until they're processed.
  async function waitUntilAssetProcessed(assetId: string, localeCode: string) {
    const asset = await cma.getAsset(assetId);
    if (get(asset, ['fields', 'file', localeCode, 'url'])) {
      return asset;
    }

    await new Promise((resolve) => setTimeout(resolve, ASSET_PROCESSING_POLL_MS));
    return waitUntilAssetProcessed(assetId, localeCode);
  }

  function onEntityChanged(entityType: string, entityId: string, callback: (value: any) => void) {
    if (!['Entry', 'Asset'].includes(entityType)) {
      throw new Error('Invalid entity type');
    }
    if (!pubSubClient) {
      return noop;
    }
    const getEntity = entityType === 'Entry' ? spaceApi.getEntry : spaceApi.getAsset;
    const handler = (msg: { environmentId: string; entityType: string; entityId: string }) => {
      if (
        environmentIds.includes(msg.environmentId) &&
        msg.entityType === entityType &&
        msg.entityId === entityId
      ) {
        /* 
        There is no guarantee that this callback is handled before the
        cmaDocument one, which is actually updating the entity. So we wait a little bit
        Since onEntityChanged is used only in reference field editors it shouldn't be a problem to
        slow down.
        TODO: a unified document management middleware can be a better approach
        */
        return new Promise((resolve) => setTimeout(resolve, GET_WAIT_ON_ENTITY_UPDATE))
          .then(() => getEntity(entityId))
          .then(callback);
      }
    };
    pubSubClient.on(CONTENT_ENTITY_UPDATED_EVENT, handler);

    return () => {
      pubSubClient.off(CONTENT_ENTITY_UPDATED_EVENT, handler);
    };
  }
}
