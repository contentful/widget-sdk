import {
  ASSET_PROCESSING_FINISHED_EVENT,
  CONTENT_ENTITY_UPDATED_EVENT,
  PubSubClient,
} from 'services/PubSubService';
import { Entity } from 'app/entity_editor/Document/types';
import { makeApply } from './EntityState';
import { EntityAction } from './EntityActions';
import { createJsonPatch } from 'data/CMA/createJsonPatch';
import { EntityState } from 'data/CMA/EntityState';
import { RequestConfig, SpaceEndpoint } from './types';
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
  createSpaceEndpoint?: (entity: Entity) => SpaceEndpoint;
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
  const endpointUpdateOptions = getSpaceEndpointOptions(options);
  const onAssetFileProcessed = createAssetFileProcessedHandler(spaceEndpoint, pubSubClient);
  const applyAction = makeApply(spaceEndpoint);

  return { onAssetFileProcessed, onContentEntityChanged, get, update, patch, applyAction };

  function isEndpointUpToDate(entity: Entity, spaceEndpoint: SpaceEndpoint): boolean {
    return (
      entity.sys.space.sys.id === spaceEndpoint.spaceId &&
      entity.sys.environment.sys.id === spaceEndpoint.envId
    );
  }

  function getEndpoint(entity: Entity, options: EntityRepoOptions): SpaceEndpoint {
    // TODO: This is a hack to ensure the entity endpoint is always aligned with
    // the space ID specific to the entry.
    // Relates to:
    // - https://contentful.atlassian.net/browse/PEN-1542
    // - https://contentful.atlassian.net/browse/ZEND-572
    // Ideally we would be consistently making use of the spaceEndpoint
    // provided in the parameters. While we don't know what can sometimes cause
    // updates with mismatched space ID, this is the next best thing.
    if (options.createSpaceEndpoint && !isEndpointUpToDate(entity, spaceEndpoint)) {
      return options.createSpaceEndpoint(entity);
    } else {
      return spaceEndpoint;
    }
  }

  async function update(entity: Entity): Promise<Entity> {
    const collection = getCollection(entity);
    const body: RequestConfig = {
      method: 'PUT',
      path: [collection, entity.sys.id],
      version: entity.sys.version,
      data: entity,
    };
    const endpoint = getEndpoint(entity, options);
    const updatedEntity = await endpoint<Entity>(body, endpointUpdateOptions);
    triggerCmaAutoSave();
    return updatedEntity;
  }

  async function patch(lastSavedEntity: Entity, entity: Entity): Promise<Entity> {
    const collection = getCollection(entity);
    const body: RequestConfig = {
      method: 'PATCH',
      path: [collection, entity.sys.id],
      version: entity.sys.version,
      data: createJsonPatch(lastSavedEntity, entity),
    };
    const endpoint = getEndpoint(entity, options);
    const updatedEntity = await endpoint<Entity>(body, {
      ...endpointUpdateOptions,
      'Content-Type': 'application/json-patch+json',
    });
    triggerCmaAutoSave();
    return updatedEntity;
  }

  function get(entityType: CollectionEndpoint, entityId: string) {
    const collection = CollectionEndpoint[entityType];
    const body: RequestConfig = {
      method: 'GET',
      path: [collection, entityId],
    };
    return spaceEndpoint<Entity>(body, endpointGetOptions);
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
