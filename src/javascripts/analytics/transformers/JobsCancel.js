import { addUserOrgSpace } from './Decorators';
import { getSnowplowSchema } from 'analytics/SchemasSnowplow';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/JobsCancel
 * @description
 * Exports a function that transforms data for the extension install event
 */
export default addUserOrgSpace(getJobsCancelData);

function getJobsCancelData(_eventName, data) {
  return {
    schema: getSnowplowSchema('jobs_cancel').path,
    data: {
      job_id: data.job_id,
      action: data.action,
    },
  };
}
