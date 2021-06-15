import { TagsRepoType } from 'features/content-tags';
import ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { CONTENT_ENTITY_UPDATED_EVENT, PubSubClient } from 'services/PubSubService';
import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import { SpaceAPI, User } from '@contentful/app-sdk';
import { InternalContentType, createContentTypeApi } from './createContentTypeApi';
import { get, noop } from 'lodash';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import {
  getCMAClient,
  getDefaultCMAClient,
} from 'core/services/usePlainCMAClient/usePlainCMAClient';

import {
  generateSignedAssetUrl,
  importAsciiStringAsHS256Key,
} from 'services/SignEmbargoedAssetUrl';
import APIClient from 'data/APIClient';
import { Asset, Entry, AssetFile } from '@contentful/types';
import { SpaceContextType } from 'classes/spaceContextTypes';

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
export type InternalSpaceAPI = SpaceAPI & {
  getEntryReferences: (entryId: string) => Promise<any>;
  executeRelease: (action: string, entities: EntityLink[], type?: string) => Promise<any>;
  validateRelease: (action: string, entities: EntityLink[], type?: string) => Promise<any>;
  validateEntry: (data: any, version: number) => Promise<any>;
  createAssetKey: (data: any) => Promise<any>;
  signAssetUrl: (url: string) => Promise<string>;
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
  cma: APIClient;
  initialContentTypes: InternalContentType[];
  pubSubClient?: PubSubClient;
  environmentIds: string[];
  spaceId: string;
  tagsRepo: TagsRepoType;
  usersRepo: SpaceContextType['users'];
  readOnly?: boolean;
  appId?: string;
}): InternalSpaceAPI {
  let cachedAssetKey:
    | undefined
    | { promise: Promise<{ cryptoKey: CryptoKey; policy: string }>; expiresAtMs: number };

  const spaceApi = {
    // Proxy directly to the CMA client:
    archiveEntry: makeReadOnlyGuardedMethod(readOnly, cma.archiveEntry),
    archiveAsset: makeReadOnlyGuardedMethod(readOnly, cma.archiveAsset),
    createContentType: makeReadOnlyGuardedMethod(readOnly, cma.createContentType),
    createEntry: makeReadOnlyGuardedMethod(readOnly, cma.createEntry),
    createAsset: makeReadOnlyGuardedMethod(readOnly, cma.createAsset),
    createAssetKey: cma.createAssetKey,
    deleteAsset: makeReadOnlyGuardedMethod(readOnly, cma.deleteAsset),
    deleteContentType: makeReadOnlyGuardedMethod(readOnly, cma.deleteContentType),
    deleteEntry: makeReadOnlyGuardedMethod(readOnly, cma.deleteEntry),
    // FIXME: the types used in APIClient and SpaceAPI don't match (e.g. CollectionResponse vs. Collection/ List)
    getAsset: cma.getAsset as any,
    getAssets: cma.getAssets as any,
    getEditorInterface: cma.getEditorInterface as any,
    getEditorInterfaces: cma.getEditorInterfaces as any,
    getEntry: cma.getEntry as any,
    getEntrySnapshots: cma.getEntrySnapshots as any,
    getEntries: cma.getEntries as any,
    getContentType: cma.getContentType as any,
    getContentTypes: cma.getContentTypes as any,
    getPublishedEntries: cma.getPublishedEntries as any,
    getPublishedAssets: cma.getPublishedAssets as any,
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

    getTeams: cma.getSpaceTeams,

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

    signAssetUrl,
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
    return (initialContentTypes || []).map(createContentTypeApi);
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
    const users: any = (await usersRepo?.getAll()) ?? [];

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
          .then<Asset<AssetFile> | Entry>(() => getEntity(entityId))
          .then(callback);
      }
    };
    pubSubClient.on(CONTENT_ENTITY_UPDATED_EVENT, handler);

    return () => {
      pubSubClient.off(CONTENT_ENTITY_UPDATED_EVENT, handler);
    };
  }

  function fetchCachedAssetKey(
    minExpiresAtMs: number
  ): Promise<{ policy: string; cryptoKey: CryptoKey }> {
    if (!cachedAssetKey || cachedAssetKey.expiresAtMs < minExpiresAtMs) {
      // Create a new key at 46h (near the maximum validity of 48h)
      const expiresAtMs = Date.now() + 46 * 60 * 60 * 1000;
      if (minExpiresAtMs > expiresAtMs) {
        throw new Error(
          `Cannot fetch an asset key so far in the future: ${minExpiresAtMs} > ${expiresAtMs}`
        );
      }
      const promise = (
        cma.createAssetKey({ expiresAt: Math.floor(expiresAtMs / 1000) }) as Promise<{
          policy: string;
          secret: string;
        }>
      ).then(
        async ({ policy, secret }: { policy: string; secret: string }) => {
          const cryptoKey = await importAsciiStringAsHS256Key(secret);
          return {
            policy,
            cryptoKey,
          };
        },
        (err: unknown) => {
          // If we encounter an error, make sure to clear the cache item if
          // this is the current pending fetch
          if (cachedAssetKey && cachedAssetKey.promise === promise) {
            cachedAssetKey = undefined;
          }
          return Promise.reject(err);
        }
      );
      cachedAssetKey = { expiresAtMs, promise };
    }
    return cachedAssetKey.promise;
  }

  async function signAssetUrl(url: string, lifetimeSeconds = 60): Promise<string> {
    const expiresAtMs = Date.now() + lifetimeSeconds * 1000;
    const { policy, cryptoKey } = await fetchCachedAssetKey(expiresAtMs);
    return await generateSignedAssetUrl(cryptoKey, policy, url, expiresAtMs);
  }
}
