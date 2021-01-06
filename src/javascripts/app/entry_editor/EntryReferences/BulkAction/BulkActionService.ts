import type { PublishableEntity, Link } from '@contentful/types';
import { executeBulkAction, getBulkAction } from '../referencesService';

const BULKACTION_REFRESH_LIMIT = 60; // number of times we want to perform a refresh
const BULKACTION_REFRESH_INTERVAL = 1000; // in MS

type VersionedLink = {
  sys: {
    id: string;
    linkType: string;
    type: 'Link';
    version: number;
  };
};

enum BulkActionStatus {
  Created = 'created',
  InProgress = 'inProgress',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

type BulkAction = {
  sys: {
    type: 'BulkAction';
    id: string;
    space: Link<'Space'>;
    environment: Link<'Environment'>;
    startedAt: string;
    createdAt: string; // timestamp
    completedAt: string;
    createdBy: Link<'User'>;
    status: BulkActionStatus;
  };
  action: 'publish';
  error: {
    sys: {
      type: Error;
      id: string;
    };
    message: string;
  };
};

const linkWithVersion = (entity: PublishableEntity): VersionedLink => {
  return {
    sys: {
      id: entity.sys.id,
      linkType: entity.sys.type,
      type: 'Link',
      version: entity.sys.version,
    },
  };
};

/**
 * Check if an entity exists in a given list of Entities (by id and type)
 **/
const entityIsIncluded = (entitiesList: VersionedLink[], entity: PublishableEntity) => {
  return entitiesList.some((e) => e.sys.id === entity.sys.id && e.sys.type === entity.sys.type);
};

const mapEntities = (entities: PublishableEntity[]): VersionedLink[] => {
  const uniqEntities: VersionedLink[] = [];

  entities.forEach((entity) => {
    const alreadyIncluded = entityIsIncluded(uniqEntities, entity);

    if (!alreadyIncluded) uniqEntities.push(linkWithVersion(entity));
  });

  return uniqEntities;
};

async function publishBulkActionAndWait(entities) {
  let refreshCount = 0;
  const bulkAction: BulkAction = await executeBulkAction({ entities, action: 'publish' });

  return new Promise((resolve, reject) => {
    const refreshInterval = setInterval(async () => {
      try {
        const refreshedBulkAction: BulkAction = await getBulkAction(bulkAction.sys.id);

        if (refreshedBulkAction.sys.status === BulkActionStatus.Succeeded) {
          clearInterval(refreshInterval);
          resolve(refreshedBulkAction);
        }

        if (refreshedBulkAction.sys.status === BulkActionStatus.Failed) {
          clearInterval(refreshInterval);
          reject(refreshedBulkAction.error.message);
        }

        refreshCount += 1;

        if (refreshCount >= BULKACTION_REFRESH_LIMIT) {
          clearInterval(refreshInterval);
          reject('Action took too long to respond');
        }
      } catch (error) {
        reject('Failed');
        clearInterval(refreshInterval);
      }
    }, BULKACTION_REFRESH_INTERVAL);
  });
}

export async function publishBulkAction(entities) {
  return publishBulkActionAndWait(mapEntities(entities));
}
