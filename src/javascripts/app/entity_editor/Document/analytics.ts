import { intersection } from 'lodash';
import { Entity } from './types';
import * as Analytics from 'analytics/Analytics';
import changedEntityFieldPaths from './changedEntityFieldPaths';
import { EntityRepo } from 'data/CMA/EntityRepo';
import * as logger from 'services/logger';
import { getState, State } from 'data/CMA/EntityState';

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
    } else {
      logger.logError('Could not fetch remote entity for CmaDocument edit conflict tracking', e);
    }
    return;
  }

  // Do not track if there's no conflict. E.g. if we call this function due to a `BadRequest`
  // error to accommodate for possible entity deletion kind of conflict.
  if (remoteEntity && localEntity.sys.version !== remoteEntity.sys.version) {
    const data = conflictEntitiesToTrackingData({
      localEntity,
      remoteEntity,
      changedLocalEntity,
      localEntityFetchedAt,
    });
    Analytics.track('entity_editor:edit_conflict', data);
  }
}

function conflictEntitiesToTrackingData({
  localEntity,
  remoteEntity,
  changedLocalEntity,
  localEntityFetchedAt,
}) {
  const localChangesFieldPaths = formatFieldPaths(
    changedEntityFieldPaths(localEntity.fields, changedLocalEntity.fields)
  );
  const remoteChangesFieldPaths = formatFieldPaths(
    changedEntityFieldPaths(localEntity.fields, remoteEntity.fields || {})
  );
  const localChangesPaths = localChangesFieldPaths; // TODO: Include metadata.
  const remoteChangesPaths = remoteChangesFieldPaths; // TODO: Include metadata.
  return {
    entityId: localEntity.sys.id,
    entityType: localEntity.sys.type,
    localChangesPaths,
    remoteChangesPaths,
    localEntityState: stateTrackingString(getState(localEntity.sys)),
    localStateChange: null, // TODO: Add some tracking of state change conflicts using this.
    remoteEntityState: stateTrackingString(getState(remoteEntity.sys)),
    localEntityVersion: localEntity.sys.version,
    remoteEntityVersion: remoteEntity.sys.version,
    localEntityUpdatedAtTstamp: localEntity.sys.updatedAt,
    remoteEntityUpdatedAtTstamp: remoteEntity.sys.updatedAt,
    remoteEntityUpdatedByUserId: remoteEntity.sys.updatedBy.sys.id,
    localEntityLastFetchedAtTstamp: localEntityFetchedAt.toISOString(),
    isConflictAutoResolvable: false,
    autoConflictResolutionVersion: 1,
    precomputed: {
      sameFieldLocaleConflictsCount: intersection(localChangesFieldPaths, remoteChangesFieldPaths)
        .length,
      localFieldLocaleChangesCount: localChangesFieldPaths.length,
      remoteFieldLocaleChangesCount: remoteChangesFieldPaths.length,
      // TODO: Add metadata conflicts tracking:
      sameMetadataConflictsCount: 0,
      localMetadataChangesCount: 0,
      remoteMetadataChangesCount: 0,
    },
  };
}

function formatFieldPaths(paths) {
  return paths.map((path) => `fields:${path.join(':')}`);
}

function stateTrackingString(state) {
  switch (state) {
    case State.Changed(): // Changed entries are actually "published".
    case State.Published():
      return 'published';
    case State.Draft():
      return 'draft';
    case State.Archived():
      return 'archived';
    case State.Deleted(): // Might be deleted or just not accessible for the user.
      return 'inaccessible';
    default:
      logger.logError(`Unhandled entity state ${state}`, {
        groupingHash: 'unhandledEntityStatusInDocumentAnalytics',
        data: { entityState: state },
      });
  }
}
