import { mapValues, memoize, toPlainObject } from 'lodash';
import newBatchEntityFetcher from './newBatchEntityFetcher';

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
  // Allow to call all - not just overwritten - functions directly, out of context:
  const cmaFunctions = mapValues(toPlainObject(cma), (_fn, name) => (...args) =>
    cma[name](...args)
  );
  return {
    ...cmaFunctions,

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
