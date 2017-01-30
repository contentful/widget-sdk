import {extend} from 'lodash';
import {getSchema} from 'analytics/snowplow/Schemas';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/CreateSpace
 * @description
 * Exports a function that transforms data for the `space:created_from_template`
 * event into Snowplow's format
 */
export default function (_eventName, data) {
  const baseData = getBaseData(data);
  return {
    data: {},
    contexts: [{
      schema: getSchema('space').path,
      data: extend({action: 'create'}, baseData)
    }, {
      schema: getSchema('space_template').path,
      data: extend({name: data.templateName}, baseData)
    }]
  };
}

function getBaseData (data) {
  return {
    'organization_id': data.organizationId,
    'space_id': data.spaceId,
    'executing_user_id': data.userId
  };
}
