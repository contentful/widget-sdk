import { getSchema } from 'analytics/Schemas';
import { addUserOrgSpace, omitMetadata, snakeCaseKeys } from './Decorators';

const MAX_CSV_LENGTH = 8192; // As "maxLength" defined in the Snowplow schema.

/**
 * Transforms data for the entity_editor_edit_conflict snowplow event.
 *
 * @returns {object}
 */
export default addUserOrgSpace(function (_eventName, data) {
  const { localChangesPaths, remoteChangesPaths, precomputed, ...otherData } = omitMetadata(data);
  localChangesPaths.join(',');
  return {
    schema: getSchema('entity_editor_edit_conflict').path,
    data: {
      ...snakeCaseKeys(otherData),
      local_changes_paths: csvOrNull(localChangesPaths),
      remote_changes_paths: csvOrNull(remoteChangesPaths),
      precomputed: snakeCaseKeys(precomputed),
    },
  };
});

/**
 * Ensures we do not send invalid events with too many IDs that have a combined
 * length exceeding the event schema's limits. In this case we just track
 * `null` while still having some of the relevant info as `precomputed`.
 */
function csvOrNull(array) {
  const csv = array.join(',');
  return csv.length > MAX_CSV_LENGTH ? null : csv;
}
