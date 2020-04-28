import { Entity } from './types';
import * as Analytics from 'analytics/Analytics';
import changedEntityFieldPaths from './changedEntityFieldPaths';
import { EntityRepo } from 'data/CMA/EntityRepo';
import * as logger from 'services/logger';

export async function trackEditConflict({
  entityRepo,
  localEntity,
  localEntityFetchedAt,
  changedLocalEntity,
  ...options
}: {
  entityRepo: EntityRepo;
  localEntity: Entity;
  localEntityFetchedAt: Date;
  changedLocalEntity: Entity;
  remoteEntity?: Entity;
}) {
  let remoteEntity: Entity | null;
  try {
    remoteEntity =
      options.remoteEntity || (await entityRepo.get(localEntity.sys.type, localEntity.sys.id));
  } catch (e) {
    if (e.code === 'NotFound') {
      // TODO: Track deleted entity conflict with affordable analytics. move to separate function
      //  To avoid accidentally tracking `BadRequest` errors as a conflict.
      return;
    } else {
      // @ts-ignore
      logger.logError('Could not fetch remote entity for CmaDocument edit conflict tracking', e);
      return;
    }
  }

  // Do not track if there's no conflict. E.g. if we call this function due to a `BadRequest`
  // error to accommodate for possible entity deletion kind of conflict.
  if (localEntity.sys.version !== remoteEntity.sys.version) {
    const data = conflictEntitiesToTrackingData();
    Analytics.track('entity_editor:edit_conflict', data);
  }

  function conflictEntitiesToTrackingData() {
    return {
      entityId: localEntity.sys.id,
      entityType: localEntity.sys.type,
      localChangesFieldPaths: changedEntityFieldPaths(
        localEntity.fields,
        changedLocalEntity.fields
      ).map((path) => path.join(':')),
      remoteChangesSinceLocalEntityFieldPaths: changedEntityFieldPaths(
        localEntity.fields,
        remoteEntity.fields || {}
      ).map((path) => path.join(':')),
      localEntityVersion: localEntity.sys.version,
      remoteEntityVersion: remoteEntity.sys.version,
      localEntityUpdatedAtTstamp: localEntity.sys.updatedAt,
      remoteEntityUpdatedAtTstamp: remoteEntity.sys.updatedAt,
      remoteEntityUpdatedByUserId: remoteEntity.sys.updatedBy.sys.id,
      localEntityLastFetchedAtTstamp: localEntityFetchedAt.toISOString(),
      isConflictAutoResolvable: false,
      autoConflictResolutionVersion: 1,
    };
  }
}
