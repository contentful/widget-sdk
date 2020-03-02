import { getSchema } from 'analytics/Schemas';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/EntryReferences
 * @description
 * Exports a function that transforms data for the entry references
 */

function getEntryReferencesData(_eventName, data) {
  return {
    schema: getSchema('entry_references').path,
    data: {
      organization_id: data.organizationId,
      space_id: data.spaceId,
      entry_id: data.entry_id,
      references_depth: data.references_depth,
      references_per_level: data.references_per_level,
      circular_references_count: data.circular_references_count
    }
  };
}

export default getEntryReferencesData;
