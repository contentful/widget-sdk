/**
 * @typedef { import("contentful-ui-extensions-sdk").SpaceAPI } SpaceAPI
 */

import * as PublicContentType from 'widgets/PublicContentType';
import ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { waitUntilAssetProcessed } from 'widgets/bridges/makeExtensionSpaceMethodsHandlers';
import { CONTENT_ENTITY_UPDATED_EVENT } from 'services/PubSubService';

/**
 * @param {APIClient} cma
 * @param {ContentType[]} initialContentTypes
 * @param {PubSubClient | undefined} pubSubClient
 * @param {String[]} environmentIds
 * @return {SpaceAPI}
 */
export function createSpaceApi({ cma, initialContentTypes, pubSubClient, environmentIds }) {
  const {
    getAsset,
    getAssets,
    getEntry,
    getEntries,
    getContentType,
    getContentTypes,
    createEntry,
    createAsset,
  } = cma;

  return {
    getCachedContentTypes: () => {
      return initialContentTypes.map((contentType) => PublicContentType.fromInternal(contentType));
    },
    getEntries,
    getAsset,
    getAssets,
    getEntry,
    getContentType,
    getContentTypes,
    createEntry,
    createAsset,
    waitUntilAssetProcessed: (assetId, locale) => {
      return waitUntilAssetProcessed(cma, assetId, locale);
    },
    processAsset: (...args) => {
      return cma.processAsset(...args);
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
