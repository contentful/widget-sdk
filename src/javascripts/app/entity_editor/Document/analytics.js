import * as Analytics from 'analytics/Analytics';
import changedEntityFieldPaths from './changedEntityFieldPaths';
import { cmaGetEntity } from './api';
import * as logger from 'services/logger';
export async function trackEditConflict({
  spaceEndpoint,
  localEntity,
  localEntityFetchedAt,
  changedLocalEntity,
}) {
  let remoteEntity;
  try {
    const { sys } = localEntity;
    remoteEntity = await cmaGetEntity(spaceEndpoint, sys.type, sys.id);
  } catch (e) {
    if (e.code === 'NotFound') {
      // TODO: track with affordable analytics
      return;
    } else {
      // @ts-ignore
      logger.logError('Could not fetch remote entity for CmaDocument edit conflict tracking');
      return;
    }
  }
  const data = conflictEntitiesToTrackingData();
  Analytics.track('entity_editor:edit_conflict', data);
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
