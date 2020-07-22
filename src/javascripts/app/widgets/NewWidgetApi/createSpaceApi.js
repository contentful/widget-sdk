/**
 * @typedef { import("contentful-ui-extensions-sdk").SpaceAPI } SpaceAPI
 */

import * as PublicContentType from 'widgets/PublicContentType';
import ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { waitUntilAssetProcessed } from 'widgets/bridges/makeExtensionSpaceMethodsHandlers';
import { CONTENT_ENTITY_UPDATED_EVENT } from 'services/PubSubService';
import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';

/**
 * @param {APIClient} cma
 * @param {ContentType[]} initialContentTypes
 * @param {PubSubClient | undefined} pubSubClient
 * @param {String[]} environmentIds
 * @return {SpaceAPI}
 */
export function createSpaceApi({
  cma,
  initialContentTypes,
  pubSubClient,
  environmentIds,
  spaceId,
  tagsRepo,
  usersRepo,
}) {
  const {
    archiveEntry,
    archiveAsset,
    createContentType,
    createEntry,
    createAsset,
    deleteAsset,
    deleteContentType,
    deleteEntry,
    executeRelease,
    getAsset,
    getAssets,
    getEditorInterface,
    getEditorInterfaces,
    getEntry,
    getEntryReferences,
    getEntrySnapshots,
    getEntries,
    getContentType,
    getContentTypes,
    getPublishedEntries,
    getPublishedAssets,
    processAsset,
    publishAsset,
    publishEntry,
    unarchiveAsset,
    unarchiveEntry,
    unpublishAsset,
    unpublishEntry,
    updateAsset,
    updateContentType,
    updateEntry,
    validateEntry,
    validateRelease,
  } = cma;

  return {
    getCachedContentTypes: () => {
      return initialContentTypes.map((contentType) => PublicContentType.fromInternal(contentType));
    },
    archiveEntry,
    archiveAsset,
    createContentType,
    createEntry,
    createAsset,
    deleteAsset,
    deleteContentType,
    deleteEntry,
    executeRelease,
    getAsset,
    getAssets,
    getEditorInterface,
    getEditorInterfaces,
    getEntry,
    getEntryReferences,
    getEntrySnapshots,
    getEntries,
    getContentType,
    getContentTypes,
    getPublishedEntries,
    getPublishedAssets,
    processAsset,
    publishAsset,
    publishEntry,
    unarchiveAsset,
    unarchiveEntry,
    unpublishAsset,
    unpublishEntry,
    updateAsset,
    updateContentType,
    updateEntry,
    validateEntry,
    validateRelease,

    readTags: tagsRepo.readTags,
    createTag: tagsRepo.createTag,
    deleteTag: tagsRepo.deleteTag,
    updateTag: tagsRepo.updateTag,

    createUpload: async (base64Data) => {
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
    },

    getUsers: async () => {
      const users = (await usersRepo.getAll()) ?? [];

      return {
        sys: { type: 'Array' },
        total: users.length,
        skip: 0,
        limit: users.length,
        items: users.map((user) => ({
          sys: { type: 'User', id: user.sys.id },
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatarUrl: user.avatarUrl,
        })),
      };
    },

    waitUntilAssetProcessed: (assetId, locale) => {
      return waitUntilAssetProcessed(cma, assetId, locale);
    },
    getEntityScheduledActions: (entityType, entityId) => {
      return ScheduledActionsRepo.getEntityScheduledActions(entityType, entityId);
    },
    getAllScheduledActions: () => {
      return ScheduledActionsRepo.getAllScheduledActions();
    },
    onEntityChanged(entityType, entityId, callback) {
      if (!['Entry', 'Asset'].includes(entityType)) {
        throw new Error('Invalid entity type');
      }
      if (!pubSubClient) {
        return () => {};
      }
      const getEntity = entityType === 'Entry' ? getEntry : getAsset;
      const handler = (msg) => {
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
    },
  };
}
