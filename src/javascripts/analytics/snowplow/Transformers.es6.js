import {getTransformer} from 'analytics/snowplow/Events';
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
 * @name analytics/snowplow/Transformers#get
 * @param {string} eventName
 * @description
 * Returns transformer object with a .run() method. Transformers should be invoked
 * by calling run with the data to be transformed as an argument.
 *
 * @usage[js]
 * const rawData = {foo: '!!!!'}
 * const transformer = Transformer.get('content_type:create');
 * const dataForSnowplow = transformer.run(rawData);
 */
export function transformData (eventName, data) {
  const transformerName = getTransformer(eventName);
  return _transformers[transformerName](eventName, data);
}
