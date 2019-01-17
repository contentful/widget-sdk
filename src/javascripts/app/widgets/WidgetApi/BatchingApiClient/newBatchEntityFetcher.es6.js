import DataLoader from 'dataloader';
import { detect as detectBrowser } from 'detect-browser';
import { apiUrl } from 'Config.es6';
import {
  default as newEntityBatchLoaderFn,
  MAX_FETCH_LIMIT,
  WORST_CASE_QUERY_PARAMS
} from './newEntityBatchLoaderFn.es6';

const MAX_URL_LENGTH = detectBrowser().name === 'ie' ? 2000 : 8000;
const MAX_ID_LENGTH = 64;
const MAX_LENGTH_ID = 'X'.repeat(MAX_ID_LENGTH);
const WORST_CASE_URL = encodeURI(
  apiUrl(
    `/spaces/${MAX_LENGTH_ID}/environments/${MAX_LENGTH_ID}/content_types?${WORST_CASE_QUERY_PARAMS}`
  )
);
const URL_IDS_PORTION_LENGTH = MAX_URL_LENGTH - WORST_CASE_URL.length;
const MAX_BATCH_SIZE = Math.min(
  MAX_FETCH_LIMIT,
  Math.floor((URL_IDS_PORTION_LENGTH + 1) / (MAX_ID_LENGTH + 1)) // +1 for ','
);

/**
 * @param {function} options.getResources
 * @param {string} options.resourceContext.type API resource type, e.g. 'Entry'
 * @param {string} options.resourceContext.envId
 * @param {string} options.resourceContext.spaceId
 * @returns {function}
 */
export default function newBatchEntityFetcher({ getResources, resourceContext }) {
  const batchLoaderFn = newEntityBatchLoaderFn({ getResources, newEntityNotFoundError });
  // TODO: This is way too pessimistic, in the real world, 99% of IDs should be
  //  significantly shorter than 64 chars (mostly 32 chars). Optimize by calculating
  //  batch size dynamically (might require a DataLoader contribution).
  const loader = new DataLoader(batchLoaderFn, { maxBatchSize: MAX_BATCH_SIZE });
  return id =>
    loader
      .load(id)
      // Clear the cache after each cycle of loading data. This ensures we load a
      // current version of the entity in subsequent calls. Currently we only try
      // to optimize fetching entities requested "at the same time" (same tick),
      // TODO: Lots of potential for a FE architecture where we can cache this and
      //  do smarter, controlled cache purges on e.g. routing.
      // TODO: Only clear cache once per cycle instead of for each load.
      .then(clearCache, clearCache);

  function clearCache(entityOrError) {
    loader.clearAll();
    if (entityOrError instanceof Error) {
      throw entityOrError;
    }
    return entityOrError;
  }

  /**
   * Builds a CMA `NotFound` error as the Data.APIClient would return it.
   *
   * NOTE: Alternatively, we could do a separate CMA call to the .getResource() fn
   * to get an 'original' API error. We could also use `contentful-errors` to
   * construct this and other errors if necessary.
   *
   * @returns {Error}
   */
  function newEntityNotFoundError(entityId) {
    const status = 404;
    return Object.assign(new Error('Entity not found'), {
      status,
      statusCode: status,
      code: 'NotFound',
      data: newActualApiError(entityId),
      headers: () => ({}),
      request: {}
    });
  }

  function newActualApiError(entityId) {
    return {
      sys: {
        type: 'Error',
        id: 'NotFound'
      },
      message: 'The resource could not be found.',
      details: {
        type: resourceContext.type,
        id: entityId,
        environment: resourceContext.envId,
        space: resourceContext.spaceId
      },
      requestId: 'web-app__batchEntityFetcher'
    };
  }
}
