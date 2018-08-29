/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/BulkEditor
 * @description
 * Exports a function that transforms data for the bulk editor
 */
export default function(eventName, data) {
  return {
    data: {
      action: eventName,
      executing_user_id: data.userId,
      space_id: data.spaceId,
      organization_id: data.organizationId,
      entry_id: data.entryId,
      parent_entry_id: data.parentEntryId,
      option_existing: data.existing,
      option_added: data.added,
      ref_count: data.refCount,
      num_edited_entries: data.numEditedEntries,
      num_published_entries: data.numPublishedEntries,
      status: data.status,
      content_type_id: data.contentTypeId
    }
  };
}
