/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/Snapshot
 * @description
 * Exports a function that transforms data for tracking versioning
 */
export default function(eventName, data) {
  return {
    data: {
      action: eventName,
      executing_user_id: data.userId,
      space_id: data.spaceId,
      organization_id: data.organizationId,
      entry_id: data.entryId,
      snapshot_id: data.snapshotId,
      source: data.source,
      option_changes_discarded: data.changesDiscarded,
      option_full_restore: data.fullRestore,
      option_show_diffs_only: data.showDiffsOnly,
      restore_fields_count: data.restoreFieldsCount
    }
  };
}
