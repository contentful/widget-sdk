import { toPlainObject, memoize, mapKeys } from 'lodash';
import DataLoader from 'dataloader';

/**
 * Takes a client instance and returns an object with identical interface.
 * Wraps all getResource() calls for fetching a single resource in a function that does
 * one batch request to the getResources() equivalent once per tick instead of calling
 * getResource() immediately.
 *
 * @param {Data.APIClient} cma
 * @returns {Object} With same interface as `cma`.
 */
export const getOptimizedApiClient = memoize(cma => {
  const { spaceId, envId } = cma;
  const newResourceContext = type => ({ type, spaceId, envId });
  return {
    ...toPlainObject(cma),

    getContentType: batchEntityFetcher({
      getResources: query => cma.getContentTypes(query),
      resourceContext: newResourceContext('ContentType'),
      maxBatchSize: 1000 // API's max. CTs are small and can be fetched all at once.
    }),

    getAsset: batchEntityFetcher({
      getResources: query => cma.getAssets(query),
      resourceContext: newResourceContext('Asset'),
      maxBatchSize: 200
    }),

    getEntry: batchEntityFetcher({
      getResources: query => cma.getEntries(query),
      resourceContext: newResourceContext('Entry'),
      maxBatchSize: 40 // Entries can be huge, avoid 8mb response payload limit.
    })
  };
});

/**
 * @param {function} options.getResources
 * @param {string} options.resourceContext.type API resource type, e.g. 'Entry'
 * @param {string} options.resourceContext.envId
 * @param {string} options.resourceContext.spaceId
 * @param {number} options.maxBatchSize
 * @returns {function}
 */
export function batchEntityFetcher({ getResources, resourceContext, _maxBatchSize }) {
  const batchLoaderFn = newEntityBatchLoaderFn({ getResources, newEntityNotFoundError });
  const loader = new DataLoader(batchLoaderFn);
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
   * to get an 'original' API error.
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
    const query = { 'sys.id[in]': entityIds.join(',') };
    // Can't implement as `async` to ensure a faulty `getResources` implementation
    // immediately throws instead of rejecting.
    return getResources(query).then(handleSuccess, handleError);

    function handleSuccess(response) {
      const entitiesByIds = mapKeys(response.items, entity => entity.sys.id);
      return entityIds.map(id => entitiesByIds[id] || newEntityNotFoundError(id));
    }

    function handleError(error) {
      return entityIds.map(() => error);
    }
  };
}
