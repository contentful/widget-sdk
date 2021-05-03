import { mapKeys } from 'lodash';
import { isValidResourceId } from 'data/utils';
import {
  isResponseSizeTooBigError,
  fetchInChunks,
  RESPONSE_SIZE_EXCEEDED_MAX_RETRIES,
} from './utils';
import { captureError } from 'core/monitoring';

/**
 * Returns a function that can be used with `dataloader` to fetch entities.
 *
 * @param {Function} getResources
 * @param {Function} newEntityNotFoundError
 * @returns {function(*): Promise<Array<Object|Error>>}
 */
export default function newEntityBatchLoaderFn({ getResources, newEntityNotFoundError }) {
  return (entityIds) => {
    let responseSizeExceededRetries = 0;
    // Filter out IDs >64 chars (and otherwise invalid IDs) as multiple IDs >64
    // chars might result in a weird 504 CMA response before we hit the ~8000
    // character url limit that causes a proper 414 response.
    const validIds = entityIds.filter(isValidResourceId);
    const loading = validIds.length
      ? getResources(buildQueryParamsToFetchIds(validIds))
      : Promise.resolve({ items: [] });
    // Can't implement as `async` to ensure a faulty `getResources` implementation
    // immediately throws instead of rejecting.
    return loading.then(handleSuccess, handleError);

    function handleSuccess({ items }) {
      const entitiesByIds = mapKeys(items, (entity) => entity.sys.id);
      return entityIds.map((id) => entitiesByIds[id] || newEntityNotFoundError(id));
    }

    function handleError(error) {
      if (
        isResponseSizeTooBigError(error) &&
        responseSizeExceededRetries < RESPONSE_SIZE_EXCEEDED_MAX_RETRIES
      ) {
        // If the server has responded with 400 due to the requested resources
        // exceeding the hard limit of 7mb, then we attempt to fetch them in
        // 5 chunks
        responseSizeExceededRetries++;
        return fetchInChunks(getResources, validIds).then(handleSuccess, handleError);
      }
      logError(error);
      return entityIds.map(() => error);
    }

    function logError(error) {
      // Add some redundant computed info (this stuff is already available in `error`)
      // just in case Bugsnag trims any of this info because of its length.
      const data = {
        requestedIds: validIds,
        requestedIdsCount: validIds.length,
        requestedIdsCharacterCount: validIds.join('').length,
      };
      // Though not expected, let's keep an eye on 504s and other potential weird
      // stuff that we don't know about. Ignore -1 as it's about network issues.
      if (error && error.status !== -1) {
        captureError(new Error('BatchingApiClient: Failed bulk fetching entities'), {
          extra: {
            error,
            data,
          },
        });
      }
    }
  };
}

export const MAX_FETCH_LIMIT = 999;
const FETCH_PARAM = 'sys.id[in]';
export const WORST_CASE_QUERY_PARAMS = `limit=${MAX_FETCH_LIMIT}&${FETCH_PARAM}=`;

export function buildQueryParamsToFetchIds(ids) {
  const params = {
    [FETCH_PARAM]: ids.join(','),
  };
  // If not set and `ids.length > 100`, e.g. 119, then CMA would start pagination
  // and the request would return the first 100 (CMA default) while we would
  // resolve the remaining 19 as "not found", which would be a severe bug.
  if (ids.length > 100) {
    params.limit = MAX_FETCH_LIMIT;
  }
  return params;
}
