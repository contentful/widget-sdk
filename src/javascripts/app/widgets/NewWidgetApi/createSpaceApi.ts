import ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { CONTENT_ENTITY_UPDATED_EVENT, PubSubClient } from 'services/PubSubService';
import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import { SpaceAPI, ContentType, User } from 'contentful-ui-extensions-sdk';
import { createContentTypeApi } from './createContentTypeApi';
import { get, noop } from 'lodash';

const ASSET_PROCESSING_POLL_MS = 500;

// TODO: find a better name
// This has been implemented with generics to not lose type inference, even though it's ugly
const readOnlyWrapper = <T extends Function>(readOnly: boolean, method: T) => {
  if (readOnly) {
    return () => {
      throw new Error(`Cannot invoke ${method.name ?? method} in Read Only APIs`);
    };
  }

  return method;
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
  readTags: (skip: number, limit: number) => Promise<any>;
  createTag: (id: string, name: string, version: number) => Promise<any>;
  deleteTag: (id: string, version: number) => Promise<boolean>;
  updateTag: (id: string, name: string, version: number) => Promise<any>;
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
}: {
  cma: any;
  initialContentTypes: ContentType[];
  pubSubClient?: PubSubClient;
  environmentIds: string[];
  spaceId: string;
  tagsRepo: any;
  usersRepo: any;
  readOnly?: boolean;
}): InternalSpaceAPI {
  return {
    // Proxy directly to the CMA client:
    archiveEntry: readOnlyWrapper<typeof cma.archiveEntry>(readOnly, cma.archiveEntry),
    archiveAsset: readOnlyWrapper<typeof cma.archiveAsset>(readOnly, cma.archiveAsset),
    createContentType: readOnlyWrapper<typeof cma.createContentType>(
      readOnly,
      cma.createContentType
    ),
    createEntry: readOnlyWrapper<typeof cma.createEntry>(readOnly, cma.createEntry),
    createAsset: readOnlyWrapper<typeof cma.createAsset>(readOnly, cma.createAsset),
    deleteAsset: readOnlyWrapper<typeof cma.deleteAsset>(readOnly, cma.deleteAsset),
    deleteContentType: readOnlyWrapper<typeof cma.deleteContentType>(
      readOnly,
      cma.deleteContentType
    ),
    deleteEntry: readOnlyWrapper<typeof cma.deleteEntry>(readOnly, cma.deleteEntry),
    getAsset: cma.getAsset,
    getAssets: cma.getAssets,
    getEditorInterface: cma.getEditorInterface,
    getEditorInterfaces: cma.getEditorInterfaces,
    getEntry: cma.getEntry,
    getEntrySnapshots: cma.getEntrySnapshots,
    getEntries: cma.getEntries,
    getContentType: cma.getContentType,
    getContentTypes: cma.getContentTypes,
    getPublishedEntries: cma.getPublishedEntries,
    getPublishedAssets: cma.getPublishedAssets,
    processAsset: readOnlyWrapper<typeof cma.processAsset>(readOnly, cma.processAsset),
    publishAsset: readOnlyWrapper<typeof cma.publishAsset>(readOnly, cma.publishAsset),
    publishEntry: readOnlyWrapper<typeof cma.publishEntry>(readOnly, cma.publishEntry),
    unarchiveAsset: readOnlyWrapper<typeof cma.unarchiveAsset>(readOnly, cma.unarchiveAsset),
    unarchiveEntry: readOnlyWrapper<typeof cma.unarchiveEntry>(readOnly, cma.unarchiveEntry),
    unpublishAsset: readOnlyWrapper<typeof cma.unpublishAsset>(readOnly, cma.unpublishAsset),
    unpublishEntry: readOnlyWrapper<typeof cma.unpublishEntry>(readOnly, cma.unpublishEntry),
    updateAsset: readOnlyWrapper<typeof cma.updateAsset>(readOnly, cma.updateAsset),
    updateContentType: readOnlyWrapper<typeof cma.updateContentType>(
      readOnly,
      cma.updateContentType
    ),
    updateEntry: readOnlyWrapper<typeof cma.updateEntry>(readOnly, cma.updateEntry),

    // Implementation in this module:
    getCachedContentTypes,
    createUpload: readOnlyWrapper<typeof createUpload>(readOnly, createUpload),
    getUsers,
    waitUntilAssetProcessed,
    getEntityScheduledActions: ScheduledActionsRepo.getEntityScheduledActions,
    getAllScheduledActions: ScheduledActionsRepo.getAllScheduledActions,

    // Only in internal SDK, not implemented in the public one
    getEntryReferences: cma.getEntryReferences,
    executeRelease: readOnlyWrapper<typeof cma.executeRelease>(readOnly, cma.executeRelease),
    validateRelease: readOnlyWrapper<typeof cma.validateRelease>(readOnly, cma.validateRelease),
    validateEntry: readOnlyWrapper<typeof cma.validateEntry>(readOnly, cma.validateEntry),
    readTags: tagsRepo.readTags,
    createTag: readOnlyWrapper<typeof tagsRepo.createTag>(readOnly, tagsRepo.createTag),
    deleteTag: readOnlyWrapper<typeof tagsRepo.deleteTag>(readOnly, tagsRepo.deleteTag),
    updateTag: readOnlyWrapper<typeof tagsRepo.updateTag>(readOnly, tagsRepo.updateTag),
    onEntityChanged,
  };

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
    const getEntity = entityType === 'Entry' ? cma.getEntry : cma.getAsset;
    const handler = (msg: { environmentId: string; entityType: string; entityId: string }) => {
      if (
        environmentIds.includes(msg.environmentId) &&
        msg.entityType === entityType &&
        msg.entityId === entityId
      ) {
        getEntity(entityId).then(callback);
      }
    };
    pubSubClient.on(CONTENT_ENTITY_UPDATED_EVENT, handler);

    return () => {
      pubSubClient.off(CONTENT_ENTITY_UPDATED_EVENT, handler);
    };
  }
}
