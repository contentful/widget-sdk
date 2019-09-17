import { last } from 'lodash';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/Generic
 * @description
 * Exports a function that transforms data from the Segment based internal analytics
 * format to fit Snowplow's `generic` schema.
 */
export default function(eventName, data) {
  return {
    data: transform(eventName, data)
  };
}

function transform(eventName, data) {
  return {
    action: extractAction(eventName),
    organization_id: data.organizationId,
    space_id: data.spaceId,
    executing_user_id: data.userId,
    environment_alias_id: 0,
    environment_alias_key: 'master',
    to_environment_id: 'target-master'
  };
}

function extractAction(eventName) {
  return last(eventName.split(':'));
}
