import { intersection } from 'lodash';
import { Entity } from './types';
import * as Analytics from 'analytics/Analytics';
import { changedEntityFieldPaths, changedEntityMetadataPaths } from './changedPaths';
import * as logger from 'services/logger';
import { getState, State } from 'data/CMA/EntityState';

export const ConflictType = {
  AutoResolvable: true,
  NotAutoResolvable: false,
};

export async function trackEditConflict({
  localEntity,
  localEntityFetchedAt,
  changedLocalEntity,
  remoteEntity,
  isConflictAutoResolvable,
}: {
  localEntity: Entity;
  localEntityFetchedAt: Date;
  changedLocalEntity: Entity;
  remoteEntity: Entity;
  isConflictAutoResolvable: boolean;
}) {
  // TODO: Get rid of the repetition between the code below and the code in CmaDocument.updateEntity
  const localChangedFieldPaths = formatFieldPaths(
    changedEntityFieldPaths(localEntity.fields, changedLocalEntity.fields)
  );
  const remoteChangedFieldPaths = formatFieldPaths(
    changedEntityFieldPaths(localEntity.fields, remoteEntity.fields)
  );
  const localChangedMetadataPaths = formatMetadataPaths(
    changedEntityMetadataPaths(localEntity.metadata, changedLocalEntity.metadata)
  );
  const remoteChangedMetadataPaths = formatMetadataPaths(
    changedEntityMetadataPaths(localEntity.metadata, remoteEntity.metadata)
  );

  const localChangesPaths = localChangedFieldPaths.concat(localChangedMetadataPaths);
  const remoteChangesPaths = remoteChangedFieldPaths.concat(remoteChangedMetadataPaths);
  const data = {
    entityId: localEntity.sys.id,
    entityType: localEntity.sys.type,
    localChangesPaths,
    remoteChangesPaths,
    localEntityState: stateTrackingString(getState(localEntity.sys)),
    // TODO: Add some tracking of state change conflicts using this.
    localStateChange: null,
    remoteEntityState: stateTrackingString(getState(remoteEntity.sys)),
    localEntityVersion: localEntity.sys.version,
    remoteEntityVersion: remoteEntity.sys.version,
    localEntityUpdatedAtTstamp: localEntity.sys.updatedAt,
    remoteEntityUpdatedAtTstamp: remoteEntity.sys.updatedAt,
    remoteEntityUpdatedByUserId: remoteEntity.sys.updatedBy.sys.id,
    localEntityLastFetchedAtTstamp: localEntityFetchedAt.toISOString(),
    isConflictAutoResolvable,
    // v1: Initial implementation without any conflict resolution.
    // v2: Auto-merging of different field locales or metadata.tags remotely vs. locally.
    // v3: Syncing remote entity changes back to local state via pubsub.
    autoConflictResolutionVersion: 3,
    precomputed: {
      sameFieldLocaleConflictsCount: intersection(localChangedFieldPaths, remoteChangedFieldPaths)
        .length,
      localFieldLocaleChangesCount: localChangedFieldPaths.length,
      remoteFieldLocaleChangesCount: remoteChangedFieldPaths.length,
      sameMetadataConflictsCount: intersection(
        localChangedMetadataPaths,
        remoteChangedMetadataPaths
      ).length,
      localMetadataChangesCount: localChangedMetadataPaths.length,
      remoteMetadataChangesCount: remoteChangedMetadataPaths.length,
    },
  };
  Analytics.track('entity_editor:edit_conflict', data);
}

function formatFieldPaths(paths) {
  return paths.map((path) => `fields:${path.join(':')}`);
}

function formatMetadataPaths(paths) {
  return paths.map((path) => `metadata:${path.join(':')}`);
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
