import {mapKeys, omit, snakeCase, first, last} from 'lodash';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/Generic
 * @description
 * Exports a function that transforms data from the Segment based internal analytics
 * format to fit Snowplow's `generic` schema.
 */
export default function (eventName, data) {
  return {
    data: transformGenericData(eventName, data)
  };
}

function transformGenericData (eventName, data) {
  return {
    'scope': extractScope(eventName),
    'action': extractAction(eventName),
    'organization_id': data.organizationId,
    'space_id': data.spaceId,
    'executing_user_id': data.userId,
    'payload': mapKeys(
      omit(data, ['organizationId', 'spaceId', 'userId', 'currentState']), (_val, key) => snakeCase(key)
    )
  };
}

function extractScope (eventName) {
  return first(eventName.split(':'));
}

function extractAction (eventName) {
  return last(eventName.split(':'));
}
