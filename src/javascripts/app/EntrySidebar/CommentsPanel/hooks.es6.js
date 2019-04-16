import { useCallback } from 'react';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { getAll, create } from 'data/CMA/CommentsRepo.es6';
import useAsync from 'app/common/hooks/useAsync.es6';

/**
 * Fetches all comments for the given entry.
 * Returns a state object
 * @param {string} spaceId
 * @param {string} entryId
 */
export const useCommentsFetcher = (spaceId, entryId) => {
  // avoiding infinite loop.
  const fetch = useCallback(() => {
    const endpoint = createSpaceEndpoint(spaceId);
    return getAll(endpoint, entryId);
  }, [spaceId, entryId]);

  return useAsync(fetch);
};

/**
 * Creates a comment in the given entry.
 * Returns a state object
 * @param {string} spaceId
 * @param {string} entryId
 */
export const useCommentCreator = (spaceId, entryId, body) => {
  const requestFn = useCallback(() => {
    const endpoint = createSpaceEndpoint(spaceId);
    return create(endpoint, entryId, body);
  }, [spaceId, entryId, body]);

  return useAsync(requestFn);
};
