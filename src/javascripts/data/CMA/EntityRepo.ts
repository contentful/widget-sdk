import jiff from 'jiff';
import {
  ASSET_PROCESSING_FINISHED_EVENT,
  CONTENT_ENTITY_UPDATED_EVENT,
  PubSubClient,
} from 'services/PubSubService';
import { Entity } from 'app/entity_editor/Document/types';
import { makeApply } from './EntityState';
import { EntityAction } from './EntityActions';
import { EntityState } from 'data/CMA/EntityState';
import { SpaceEndpoint } from './types';
import {
  AssetProcessingFinishedPayload,
  ContentEntityUpdatedPayload,
} from '@contentful/pubsub-types';

export enum CollectionEndpoint {
  Entry = 'entries',
  Asset = 'assets',
}

export type EntityRepo = {
  get(entityType: string, entityId: string): Promise<Entity>;
  onContentEntityChanged: (
    entitySys: { type: string; id: string },
    callback: (info: EntityRepoChangeInfo) => {}
  ) => () => ReturnType<PubSubClient['off']>;
  onAssetFileProcessed: (
    entitySys: { type: string; id: string },
    callback: Function
  ) => () => ReturnType<PubSubClient['off']>;
  update: (entity: Entity) => Promise<Entity>;
  patch: (lastSavedEntity: Entity, entity: Entity) => Promise<Entity>;
  applyAction: (action: EntityAction, uiState: EntityState, data: Entity) => Entity;
};

export interface EntityRepoChangeInfo {
  newVersion?: number;
}

interface EntityRepoOptions {
  skipDraftValidation?: boolean;
  skipTransformation?: boolean;
  indicateAutoSave?: boolean;
}

function getCollection(entity: Entity): CollectionEndpoint {
  const collection = CollectionEndpoint[entity.sys.type];
  if (!collection) {
    throw new Error('Invalid entity type');
  }
  return collection;
}

export function create(
  spaceEndpoint: SpaceEndpoint,
  pubSubClient: PubSubClient,
  triggerCmaAutoSave: { (): void },
  options: EntityRepoOptions = {
    skipDraftValidation: false,
    skipTransformation: false,
    indicateAutoSave: false,
  }
): EntityRepo {
  const endpointGetOptions = getSpaceEndpointOptions({
    skipTransformation: options.skipTransformation,
  });
  const endpointPutOptions = getSpaceEndpointOptions(options);
  const onAssetFileProcessed = createAssetFileProcessedHandler(spaceEndpoint, pubSubClient);
  const applyAction = makeApply(spaceEndpoint);

  return { onAssetFileProcessed, onContentEntityChanged, get, update, patch, applyAction };

  async function update(entity: Entity): Promise<Entity> {
    const collection = getCollection(entity);
    const body = {
      method: 'PUT',
      path: [collection, entity.sys.id],
      version: entity.sys.version,
      data: entity,
    };
    const updatedEntity = await spaceEndpoint(body, endpointPutOptions);
    triggerCmaAutoSave();
    return updatedEntity;
  }

  async function patch(lastSavedEntity: Entity, entity: Entity): Promise<Entity> {
    const collection = getCollection(entity);
    const body = {
      method: 'PATCH',
      path: [collection, entity.sys.id],
      version: entity.sys.version,
      data: jiff.diff(lastSavedEntity, entity),
    };
    const updatedEntity = await spaceEndpoint(body, {
      ...endpointPutOptions,
      'Content-Type': 'application/json-patch+json',
    });
    triggerCmaAutoSave();
    return updatedEntity;
  }

  function get(entityType: CollectionEndpoint, entityId: string) {
    const collection = CollectionEndpoint[entityType];
    const body = {
      method: 'GET',
      path: [collection, entityId],
    };
    return spaceEndpoint(body, endpointGetOptions);
  }

  function onContentEntityChanged(entitySys, callback) {
    const handler = (msg: ContentEntityUpdatedPayload) => {
      const envId = spaceEndpoint.envId || 'master';
      const isSameEntityType =
        msg.entityType === entitySys.type || msg.entityType === `Deleted${entitySys.type}`; // deleted entities return entityType=DeletedEntry
      if (isSameEntityType && msg.entityId === entitySys.id && msg.environmentId === envId) {
        callback({ newVersion: msg.version });
      }
    };
    pubSubClient.on(CONTENT_ENTITY_UPDATED_EVENT, handler);
    return () => pubSubClient.off(CONTENT_ENTITY_UPDATED_EVENT, handler);
  }
}

export function createAssetFileProcessedHandler(spaceEndpoint, pubSubClient) {
  return function onAssetFileProcessed(entitySys, callback) {
    const handler = (msg: AssetProcessingFinishedPayload) => {
      const envId = spaceEndpoint.envId || 'master';
      if (
        entitySys.type === 'Asset' &&
        msg.assetId === entitySys.id &&
        msg.environmentId === envId
      ) {
        callback();
      }
    };
    pubSubClient.on(ASSET_PROCESSING_FINISHED_EVENT, handler);
    return () => pubSubClient.off(ASSET_PROCESSING_FINISHED_EVENT, handler);
  };
}

function getSpaceEndpointOptions(entityRepoOptions: EntityRepoOptions) {
  const optionsHeaderMap = {
    skipTransformation: 'X-Contentful-Skip-Transformation',
    skipDraftValidation: 'X-Contentful-Skip-UI-Draft-Validation',
    indicateAutoSave: 'X-Contentful-UI-Content-Auto-Save',
  };
  const spaceEndpointOptions = {};
  for (const [option, header] of Object.entries(optionsHeaderMap)) {
    if (entityRepoOptions[option]) {
      spaceEndpointOptions[header] = 'true';
    }
  }
  return spaceEndpointOptions;
}
