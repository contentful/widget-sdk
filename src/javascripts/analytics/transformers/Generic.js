import { first, last } from 'lodash';
import { addUserOrgSpace, omitMetadata, snakeCaseKeys } from './Decorators';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/Generic
 * @description
 * Exports a function that transforms data from the Segment based internal analytics
 * format to fit Snowplow's `generic` schema.
 */
export default addUserOrgSpace((eventName, data) => ({
  data: {
    scope: extractScope(eventName),
    action: extractAction(eventName),
    payload: snakeCaseKeys(omitMetadata(data)),
  },
}));

function extractScope(eventName) {
  return first(eventName.split(':'));
}

function extractAction(eventName) {
  return last(eventName.split(':'));
}
