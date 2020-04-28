import { ASSET_PROCESSING_FINISHED_EVENT } from 'services/PubSubService';
import { Entity } from 'app/entity_editor/Document/types';

const COLLECTION_ENDPOINTS = {
  Entry: 'entries',
  Asset: 'assets',
};

export type SpaceEndpoint = {
  (body: any, headers: any): Entity;
  envId: string;
};

export type EntityRepo = {
  get(entityType: string, entityId: string): any;
  onAssetFileProcessed: (assetId: string, callback: any) => () => any;
  update: (entity: Entity) => Entity;
};

interface EntityRepoOptions {
  skipTransformation: boolean;
}

export function create(
  spaceEndpoint: SpaceEndpoint,
  pubSubClient,
  options: EntityRepoOptions = { skipTransformation: false }
): EntityRepo {
  const spaceEndpointOptions = options.skipTransformation
    ? { 'X-Contentful-Skip-Transformation': 'true' }
    : {};

  return { onAssetFileProcessed, get, update };

  function update(entity: Entity) {
    const collection = COLLECTION_ENDPOINTS[entity.sys.type];
    if (!collection) {
      throw new Error('Invalid entity type');
    }
    const body = {
      method: 'PUT',
      path: [collection, entity.sys.id],
      version: entity.sys.version,
      data: entity,
    };
    return spaceEndpoint(body, spaceEndpointOptions);
  }

  function get(entityType: string, entityId: string) {
    const collection = COLLECTION_ENDPOINTS[entityType];
    const body = {
      method: 'GET',
      path: [collection, entityId],
    };
    return spaceEndpoint(body, spaceEndpointOptions);
  }

  function onAssetFileProcessed(assetId: string, callback) {
    const handler = ({ assetId: assetIdFromPayload, environmentId }) => {
      const envId = spaceEndpoint.envId || 'master';
      if (assetIdFromPayload === assetId && environmentId === envId) {
        callback();
      }
    };
    pubSubClient.on(ASSET_PROCESSING_FINISHED_EVENT, handler);
    return () => pubSubClient.off(ASSET_PROCESSING_FINISHED_EVENT, handler);
  }
}
