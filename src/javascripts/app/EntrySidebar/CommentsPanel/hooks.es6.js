import { useCallback } from 'react';
import { map, uniq } from 'lodash';
import resolveLinks from 'app/OrganizationSettings/LinkResolver.es6';
import { getSpace } from 'services/TokenStore.es6';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getUsers } from 'access_control/OrganizationMembershipRepository.es6';
import { getAll, create } from 'data/CMA/CommentsRepo.es6';
import useAsync, { useAsyncFn } from 'app/common/hooks/useAsync.es6';

/**
 * Fetches all comments for the given entry.
 * Returns a state object
 * @param {string} spaceId
 * @param {string} entryId
 */
export const useCommentsFetcher = (spaceId, entryId) => {
  // avoiding infinite loop.
  const fetch = useCallback(async () => {
    return withMinDelay(fetchComments(spaceId, entryId));
  }, [spaceId, entryId]);

  return useAsync(fetch);
};

/**
 * Creates a comment in the given entry.
 * Returns a state object and a requester function
 * @param {string} spaceId
 * @param {string} entryId
 */
export const useCommentCreator = (spaceId, entryId) => {
  return useAsyncFn(async body => {
    const endpoint = createSpaceEndpoint(spaceId);
    return create(endpoint, entryId, body);
  });
};

function delay() {
  return new Promise(resolve => setTimeout(resolve, 700));
}
function withMinDelay(promise) {
  return Promise.all([promise, delay()]).then(([data]) => data);
}

async function fetchUsers(spaceId, userIds) {
  const { organization } = await getSpace(spaceId);
  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const { items } = await getUsers(orgEndpoint, {
    'sys.id[in]': userIds.join(',')
  });
  return items;
}

/**
 * Get all comments as well as all the users associated with the comments
 * and return the resolved items
 */
async function fetchComments(spaceId, entryId) {
  const endpoint = createSpaceEndpoint(spaceId);
  const { items: comments } = await getAll(endpoint, entryId);
  const commentCreatorIds = uniq(map(comments.items, 'sys.createdBy.sys.id'));
  const users = await fetchUsers(spaceId, commentCreatorIds);
  const resolvedComments = resolveLinks({
    paths: ['sys.createdBy'],
    includes: { User: users },
    items: comments
  });
  return resolvedComments;
}
