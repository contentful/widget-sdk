import { addUserOrgSpace } from './Decorators.es6';
import { getSchema } from 'analytics/snowplow/Schemas.es6';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/JobsCancel
 * @description
 * Exports a function that transforms data for the extension install event
 */
export default addUserOrgSpace(getJobsCancelData);

function getJobsCancelData(_eventName, data) {
  return {
    schema: getSchema('jobs_cancel').path,
    data: {
      job_id: data.job_id,
      action: data.action
    }
  };
}
