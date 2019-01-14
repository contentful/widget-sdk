import { toPlainObject, memoize, mapKeys } from 'lodash';
import DataLoader from 'dataloader';
import { isValidResourceId } from 'data/utils.es6';
import { detect as detectBrowser } from 'detect-browser';
import { apiUrl } from 'Config.es6';
import { getModule } from 'NgRegistry.es6';

const logger = getModule('logger');

const MAX_URL_LENGTH = detectBrowser().name === 'ie' ? 2000 : 8000;
const MAX_ID_LENGTH = 64;
const MAX_LENGTH_ID = 'X'.repeat(MAX_ID_LENGTH);
const WORST_CASE_URL = encodeURI(
  apiUrl(`/spaces/${MAX_LENGTH_ID}/environments/${MAX_LENGTH_ID}/content_types?sys.id[in]=`)
);
const URL_IDS_PORTION_LENGTH = MAX_URL_LENGTH - WORST_CASE_URL.length;
const MAX_BATCH_SIZE = Math.floor((URL_IDS_PORTION_LENGTH + 1) / (MAX_ID_LENGTH + 1)); // +1 for ','

/**
 * Takes a client instance and returns an object with identical interface.
 * Wraps all getResource() calls for fetching a single resource in a function that
 * does one batch request to the getResources() equivalent once per tick instead of
 * calling getResource() immediately.
 *
 * @param {Data.APIClient} cma
 * @returns {Object} With same interface as `cma`.
 */
export const getBatchingApiClient = memoize(cma => {
  const { spaceId, envId } = cma;
  const newResourceContext = type => ({ type, spaceId, envId });
  return {
    ...toPlainObject(cma),

    getContentType: newBatchEntityFetcher({
      getResources: query => cma.getContentTypes(query),
      resourceContext: newResourceContext('ContentType')
    }),

    getAsset: newBatchEntityFetcher({
      getResources: query => cma.getAssets(query),
      resourceContext: newResourceContext('Asset')
    }),

    getEntry: newBatchEntityFetcher({
      getResources: query => cma.getEntries(query),
      resourceContext: newResourceContext('Entry')
    })
  };
});

/**
 * @param {function} options.getResources
 * @param {string} options.resourceContext.type API resource type, e.g. 'Entry'
 * @param {string} options.resourceContext.envId
 * @param {string} options.resourceContext.spaceId
 * @returns {function}
 */
export function newBatchEntityFetcher({ getResources, resourceContext }) {
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

export function newEntityBatchLoaderFn({ getResources, newEntityNotFoundError }) {
  return entityIds => {
    // Filter out IDs >64 chars (and otherwise invalid IDs) as multiple IDs >64
    // chars might result in a weird 504 CMA response before we hit the ~8000
    // character url limit that causes a proper 414 response.
    const validIds = entityIds.filter(isValidResourceId);
    const loading = validIds.length
      ? getResources({ 'sys.id[in]': validIds.join(',') })
      : Promise.resolve({ items: [] });
    // Can't implement as `async` to ensure a faulty `getResources` implementation
    // immediately throws instead of rejecting.
    return loading.then(handleSuccess, handleError);

    function handleSuccess({ items }) {
      const entitiesByIds = mapKeys(items, entity => entity.sys.id);
      return entityIds.map(id => entitiesByIds[id] || newEntityNotFoundError(id));
    }

    function handleError(error) {
      logError(error);
      return entityIds.map(() => error);
    }

    function logError(error) {
      // Add some redundant computed info (this stuff is already available in `error`)
      // just in case Bugsnag trims any of this info because of its length.
      const data = {
        requestedIds: validIds,
        requestedIdsCount: validIds.length,
        requestedIdsCharacterCount: validIds.join('').length
      };
      // Though not expected, let's keep an eye on 504s and other potential weird
      // stuff that we don't know about.
      const message = 'BatchingApiClient: Failed bulk fetching entities';
      logger.logServerError(message, { error, data });
    }
  };
}
