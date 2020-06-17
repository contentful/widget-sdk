import { ASSET_PROCESSING_FINISHED_EVENT } from 'services/PubSubService';
import { Entity } from 'app/entity_editor/Document/types';
import { makeApply } from './EntityState';
import { EntityAction } from './EntityActions';
import { SpaceEndpoint } from './types';

const COLLECTION_ENDPOINTS = {
  Entry: 'entries',
  Asset: 'assets',
};

export type EntityRepo = {
  get(entityType: string, entityId: string): Promise<Entity>;
  onAssetFileProcessed: (assetId: string, callback: any) => () => any;
  update: (entity: Entity) => Promise<Entity>;
  applyAction: (action: EntityAction, data: Entity) => Entity;
};

interface EntityRepoOptions {
  skipDraftValidation?: boolean;
  skipTransformation?: boolean;
  indicateAutoSave?: boolean;
}

export function create(
  spaceEndpoint: SpaceEndpoint,
  pubSubClient,
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
  const applyAction = makeApply(spaceEndpoint);

  return { onAssetFileProcessed, get, update, applyAction };

  async function update(entity: Entity) {
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
    const updatedEntity = await spaceEndpoint(body, endpointPutOptions);
    triggerCmaAutoSave();
    return updatedEntity;
  }

  function get(entityType: string, entityId: string) {
    const collection = COLLECTION_ENDPOINTS[entityType];
    const body = {
      method: 'GET',
      path: [collection, entityId],
    };
    return spaceEndpoint(body, endpointGetOptions);
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
