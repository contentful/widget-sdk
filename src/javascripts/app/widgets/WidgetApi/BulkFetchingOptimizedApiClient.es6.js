import { toPlainObject, memoize, forEach, flatten, get } from 'lodash';

/**
 * Takes a client instance and returns an object with identical interface.
 * Wraps all getResource() calls for fetching a single resource in a function that does
 * one batch request to the getResources() equivalent once per tick instead of calling
 * getResource() immediately.
 *
 * @param {Data.APIClient} cma
 * @returns {Object} With same interface as `cma`.
 */
export const getOptimizedApiClient = memoize(cma => ({
  ...toPlainObject(cma),

  getContentType: batchEntityFetcher({
    getResources: query => cma.getContentTypes(query),
    maxBatchSize: 1000 // API's max. CTs are small and can be fetched all at once.
  }),

  getAsset: batchEntityFetcher({
    getResources: query => cma.getAssets(query),
    maxBatchSize: 200
  }),

  getEntry: batchEntityFetcher({
    getResources: query => cma.getEntries(query),
    maxBatchSize: 40 // Entries can be huge, avoid 8mb response payload limit.
  })
}));

/**
 *
 * @param {function} options.getResources
 * @param {number} options.maxBatchSize
 * @returns {function}
 */
export function batchEntityFetcher({ getResources, maxBatchSize }) {
  /**
   * Object with requested entity IDs as keys. Each one holds an array of
   * objects with a resolve/reject function to control the promise returned
   * by the original request.
   * @type {Object<Array<Object{resolve, reject}>>}
   */
  let deferredsByEntityId = {};
  let currentBatchTimeout;

  return id => {
    if (!Object.keys(deferredsByEntityId).length) {
      currentBatchTimeout = setTimeout(fetchCurrentBatch, 0);
    }
    const thisRequest = fetchWithCurrentBatch(id);

    if (idMapToArray(deferredsByEntityId).length >= maxBatchSize) {
      clearTimeout(currentBatchTimeout);
      fetchCurrentBatch();
    }
    return thisRequest;

    async function fetchCurrentBatch() {
      // Reset to not mix up subsequent calls.
      const pendingDeferredsByEntityId = closeCurrentBatch();
      const entityIds = Object.keys(pendingDeferredsByEntityId);

      let response;
      try {
        response = await getResources({
          'sys.id[in]': entityIds.join(',')
        });
      } catch (error) {
        if (get(error, 'data.sys.type') === 'Error') {
          rejectAllPending(error);
          return;
        }
        throw error; // E.g. a code error in getResources()
      }
      forEach(response.items, entity => {
        const deferreds = pendingDeferredsByEntityId[entity.sys.id];
        while (deferreds.length) {
          deferreds.shift().resolve(entity);
        }
      });

      rejectAllPending(newEntityNotFoundError());

      function rejectAllPending(error) {
        const deferreds = idMapToArray(pendingDeferredsByEntityId);
        forEach(deferreds, ({ reject }) => reject(error));
      }
    }

    function fetchWithCurrentBatch(id) {
      return new Promise((resolve, reject) => {
        deferredsByEntityId[id] = deferredsByEntityId[id] || [];
        deferredsByEntityId[id].push({ resolve, reject });
      });
    }

    function closeCurrentBatch() {
      const pendingDeferredsByResourceId = deferredsByEntityId;
      deferredsByEntityId = {};
      return pendingDeferredsByResourceId;
    }

    function idMapToArray(map) {
      return flatten(Object.values(map));
    }
  };
}

/**
 * TODO: This is just a naive attempt at recreating an api error. If we go with this approach
 *  we might need a more sophisticated solution. Either:
 *  - A: Do a separate CMA call to the .getResource() fn to get an "original" API error.
 *  - B: "Fake" it with all the data (should be sufficient).
 * @returns {Error}
 */
function newEntityNotFoundError() {
  const error = new Error('Entity not found');
  error.status = 404;
  error.code = 'NotFound';
  error.statusCode = 404;
  return error;
}
