import { addUserOrgSpace } from './Decorators.es6';
import { getSchema } from 'analytics/snowplow/Schemas.es6';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/JobsCreate
 * @description
 * Exports a function that transforms data for the extension install event
 */
export default addUserOrgSpace(getJobsCreateData);

function getJobsCreateData(_eventName, data) {
  return {
    schema: getSchema('jobs_create').path,
    data: {
      job_id: data.job_id,
      action: data.action,
      scheduled_for: data.scheduled_for,
      scheduled_for_timezone: data.scheduled_for_timezone,
      local_timezone: data.local_timezone,
      timezone_offset: data.timezone_offset,
      entity_id: data.entity_id
    }
  };
}
