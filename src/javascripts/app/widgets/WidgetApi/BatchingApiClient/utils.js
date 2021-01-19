import { chunk } from 'lodash';
import { buildQueryParamsToFetchIds } from './newEntityBatchLoaderFn';

export function isResponseSizeTooBigError(error) {
  return error.status === 400 && /Response size too big/.test(error.data.message);
}

export const RESPONSE_SIZE_EXCEEDED_MAX_RETRIES = 1;

export function fetchInChunks(getResources, validIds) {
  // Attempt to fetch all entries in 5 chunks
  const amountOfChunks = Math.ceil(validIds.length / 5);
  const chunks = chunk(validIds, amountOfChunks);
  const resourcePromises = chunks.map((ids) => getResources(buildQueryParamsToFetchIds(ids)));
  return Promise.all(resourcePromises).then((resources) => {
    const combinedResponse = resources.flat().reduce(
      (acc, { total, items }) => {
        const totalItems = acc.total + total;
        return {
          ...acc,
          total: totalItems,
          limit: totalItems,
          items: [...acc.items, ...items],
        };
      },
      {
        total: 0,
        skip: 0,
        items: [],
        limit: 0,
      }
    );
    return combinedResponse;
  });
}
