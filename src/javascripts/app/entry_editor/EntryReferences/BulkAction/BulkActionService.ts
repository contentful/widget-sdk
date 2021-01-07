import type { PublishableEntity, Link } from '@contentful/types';
import { executeBulkAction, getBulkAction } from '../referencesService';

const BULKACTION_REFRESH_MAX_ATTEMPTS = 30; // number of times we want to perform a refresh
const BULKACTION_REFRESH_INTERVAL = 2000; // wait X amount of time on each refresh

export interface EntityLink {
  sys: {
    id: string;
    linkType: string;
    type: 'Link';
    version?: number;
  };
}

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

const entityLink = (entity: PublishableEntity, { includeVersion = false }): EntityLink => {
  const link: EntityLink = {
    sys: {
      id: entity.sys.id,
      linkType: entity.sys.type,
      type: 'Link',
    },
  };

  if (includeVersion) {
    link.sys.version = entity.sys.version;
  }

  return link;
};

/**
 * Check if an entity exists in a given list of Entities (by id and type)
 **/
const entityIsIncluded = (entitiesList: EntityLink[], entity: PublishableEntity) => {
  return entitiesList.some((e) => e.sys.id === entity.sys.id && e.sys.type === entity.sys.type);
};

/**
 * Transform the selectedEntities to a list of unique EntityLinks
 */
const mapEntities = (entities: PublishableEntity[], { includeVersion = false }): EntityLink[] => {
  const uniqEntities: EntityLink[] = [];

  entities.forEach((entity) => {
    const alreadyIncluded = entityIsIncluded(uniqEntities, entity);

    if (!alreadyIncluded) uniqEntities.push(entityLink(entity, { includeVersion }));
  });

  return uniqEntities;
};

async function executeActionAndWait({ entities, action }) {
  let attemptsCount = 0;
  const bulkAction: BulkAction = await executeBulkAction({ entities, action });

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
          reject(refreshedBulkAction);
        }

        attemptsCount += 1;

        if (attemptsCount >= BULKACTION_REFRESH_MAX_ATTEMPTS) {
          clearInterval(refreshInterval);
          reject(refreshedBulkAction);
        }
      } catch (error) {
        clearInterval(refreshInterval);
        reject(error);
      }
    }, BULKACTION_REFRESH_INTERVAL);
  });
}

export async function publishBulkAction(entities) {
  return executeActionAndWait({
    entities: mapEntities(entities, { includeVersion: true }),
    action: 'publish',
  });
}

// Example:
export async function validateBulkAction(entities) {
  return executeActionAndWait({
    entities: mapEntities(entities, { includeVersion: false }),
    action: 'validate',
  });
}
