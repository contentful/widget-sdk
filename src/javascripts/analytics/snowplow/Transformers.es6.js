import EntityAction from 'analytics/snowplow/transformers/SpaceEntityAction';
import Generic from 'analytics/snowplow/transformers/Generic';

/**
 * @ngdoc service
 * @name analytics/snowplow/Transformers
 * @description
 * Collects Snowplow transformers and returns the correct transformer for an
 * analytics event.
 */

const _transformers = {
  'entityAction': EntityAction,
  'generic': Generic
};

/**
 * @ngdoc method
 * @name analytics/snowplow/Transformers#getTransformer
 * @param {string} name
 * @description
 * Returns transformer function. Transformers should be invoked by passing event
 * name and data as arguments.
 */
export function getTransformer (name) {
  return _transformers[name];
}
