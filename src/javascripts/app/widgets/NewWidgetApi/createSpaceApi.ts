import ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { CONTENT_ENTITY_UPDATED_EVENT, PubSubClient } from 'services/PubSubService';
import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import { ContentType, SpaceAPI, User } from 'contentful-ui-extensions-sdk';
import { createContentTypeApi } from './createContentTypeApi';
import { get, noop } from 'lodash';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

const ASSET_PROCESSING_POLL_MS = 500;

/**
 * Makes a method throw an Exception when the API is read0only
 * This has been implemented with generics to not lose type inference, even though it's ugly
 */
const makeReadOnlyGuardedMethod = <T extends Function>(readOnly: boolean, method: T) => {
  return readOnly
    ? () => {
        throw makeReadOnlyApiError(ReadOnlyApi.Space, method.name ?? method.toString());
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
    archiveEntry: makeReadOnlyGuardedMethod<typeof cma.archiveEntry>(readOnly, cma.archiveEntry),
    archiveAsset: makeReadOnlyGuardedMethod<typeof cma.archiveAsset>(readOnly, cma.archiveAsset),
    createContentType: makeReadOnlyGuardedMethod<typeof cma.createContentType>(
      readOnly,
      cma.createContentType
    ),
    createEntry: makeReadOnlyGuardedMethod<typeof cma.createEntry>(readOnly, cma.createEntry),
    createAsset: makeReadOnlyGuardedMethod<typeof cma.createAsset>(readOnly, cma.createAsset),
    deleteAsset: makeReadOnlyGuardedMethod<typeof cma.deleteAsset>(readOnly, cma.deleteAsset),
    deleteContentType: makeReadOnlyGuardedMethod<typeof cma.deleteContentType>(
      readOnly,
      cma.deleteContentType
    ),
    deleteEntry: makeReadOnlyGuardedMethod<typeof cma.deleteEntry>(readOnly, cma.deleteEntry),
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
    processAsset: makeReadOnlyGuardedMethod<typeof cma.processAsset>(readOnly, cma.processAsset),
    publishAsset: makeReadOnlyGuardedMethod<typeof cma.publishAsset>(readOnly, cma.publishAsset),
    publishEntry: makeReadOnlyGuardedMethod<typeof cma.publishEntry>(readOnly, cma.publishEntry),
    unarchiveAsset: makeReadOnlyGuardedMethod<typeof cma.unarchiveAsset>(
      readOnly,
      cma.unarchiveAsset
    ),
    unarchiveEntry: makeReadOnlyGuardedMethod<typeof cma.unarchiveEntry>(
      readOnly,
      cma.unarchiveEntry
    ),
    unpublishAsset: makeReadOnlyGuardedMethod<typeof cma.unpublishAsset>(
      readOnly,
      cma.unpublishAsset
    ),
    unpublishEntry: makeReadOnlyGuardedMethod<typeof cma.unpublishEntry>(
      readOnly,
      cma.unpublishEntry
    ),
    updateAsset: makeReadOnlyGuardedMethod<typeof cma.updateAsset>(readOnly, cma.updateAsset),
    updateContentType: makeReadOnlyGuardedMethod<typeof cma.updateContentType>(
      readOnly,
      cma.updateContentType
    ),
    updateEntry: makeReadOnlyGuardedMethod<typeof cma.updateEntry>(readOnly, cma.updateEntry),

    // Implementation in this module:
    getCachedContentTypes,
    createUpload: makeReadOnlyGuardedMethod<typeof createUpload>(readOnly, createUpload),
    getUsers,
    waitUntilAssetProcessed,
    getEntityScheduledActions: ScheduledActionsRepo.getEntityScheduledActions,
    getAllScheduledActions: ScheduledActionsRepo.getAllScheduledActions,

    // Only in internal SDK, not implemented in the public one
    getEntryReferences: cma.getEntryReferences,
    executeRelease: makeReadOnlyGuardedMethod<typeof cma.executeRelease>(
      readOnly,
      cma.executeRelease
    ),
    validateRelease: makeReadOnlyGuardedMethod<typeof cma.validateRelease>(
      readOnly,
      cma.validateRelease
    ),
    validateEntry: makeReadOnlyGuardedMethod<typeof cma.validateEntry>(readOnly, cma.validateEntry),
    readTags: tagsRepo.readTags,
    createTag: makeReadOnlyGuardedMethod<typeof tagsRepo.createTag>(readOnly, tagsRepo.createTag),
    deleteTag: makeReadOnlyGuardedMethod<typeof tagsRepo.deleteTag>(readOnly, tagsRepo.deleteTag),
    updateTag: makeReadOnlyGuardedMethod<typeof tagsRepo.updateTag>(readOnly, tagsRepo.updateTag),
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
