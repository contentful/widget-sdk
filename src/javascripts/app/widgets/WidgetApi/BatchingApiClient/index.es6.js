import { toPlainObject, memoize } from 'lodash';
import newBatchEntityFetcher from './newBatchEntityFetcher.es6';

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
