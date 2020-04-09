import { getSchema } from 'analytics/Schemas';
import { addUserOrgSpace } from './Decorators';

/**
 * Transforms data for the entity_editor_edit_conflict snowplow event.
 *
 * @returns {object}
 */
export default addUserOrgSpace((_eventName, data) => {
  return {
    schema: getSchema('entity_editor_edit_conflict').path,
    data: {
      entity_id: data.entityId,
      entity_type: data.entityType,
      local_changes_field_paths: data.localChangesFieldPaths,
      remote_changes_since_local_entity_field_paths: data.remoteChangesSinceLocalEntityFieldPaths,
      local_entity_version: data.localEntityVersion,
      remote_entity_version: data.remoteEntityVersion,
      local_entity_updated_at_tstamp: data.localEntityUpdatedAtTstamp,
      remote_entity_updated_at_tstamp: data.remoteEntityUpdatedAtTstamp,
      remote_entity_updated_by_user_id: data.remoteEntityUpdatedByUserId,
      local_entity_last_fetched_at_tstamp: data.localEntityLastFetchedAtTstamp,
      is_conflict_auto_resolvable: data.isConflictAutoResolvable,
      auto_conflict_resolution_version: data.autoConflictResolutionVersion,
    },
  };
});
