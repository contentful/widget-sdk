import { merge, omit, mapKeys, snakeCase } from 'lodash';

/**
 * Adds user, org and space information that we should include as a bare minimum
 * in all Snowplow schemas.
 *
 * @param {function} transformer
 * @returns {function}
 */
export function addUserOrgSpace(transformer) {
  return (_eventName, data) =>
    merge(transformer(_eventName, data), {
      data: {
        organization_id: data.organizationId,
        space_id: data.spaceId,
        executing_user_id: data.userId,
      },
    });
}

/**
 * Removes props that `Analytics.track(data)` calls add to `data` in addition to the
 * custom `data`. This is data used by `addUserOrgSpace` or relevant only to Segment
 * but not to Snowplow.
 *
 * @param {Object} data
 * @returns {Object}
 */
export function omitMetadata(data) {
  // TODO: Transformers should just receive this data as separate object from custom data.
  return omit(data, ['organizationId', 'spaceId', 'userId', 'currentState']);
}

/**
 * Returns the same object but with camel case keys transformed to snake case keys.
 * Only direct keys of the object, not of nested objects.
 *
 * @param {Object} data
 * @returns {Object}
 */
export function snakeCaseKeys(data) {
  return mapKeys(data, (_val, key) => snakeCase(key));
}
