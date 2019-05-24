import { useCallback } from 'react';
import { map, uniq } from 'lodash';
import resolveLinks from 'data/LinkResolver.es6';
import { getSpace, getUserSync } from 'services/TokenStore.es6';
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
export const useCommentCreator = (spaceId, entryId, parentCommentId) => {
  const user = getUserSync();
  const endpoint = createSpaceEndpoint(spaceId);

  return useAsyncFn(async body => {
    const comment = await create(endpoint, entryId, body, parentCommentId);
    comment.sys.createdBy = user;
    return comment;
  });
};

function withMinDelay(promise) {
  const delay = () => new Promise(resolve => setTimeout(resolve, 700));
  return Promise.all([promise, delay()]).then(([data]) => data);
}

async function fetchUsers(spaceId, userIds) {
  const { organization } = await getSpace(spaceId);
  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  // TODO: handle case where there are too many ids to fit into the query string
  const { items } = await getUsers(orgEndpoint, {
    'sys.id[in]': userIds.join(',')
  });
  return items;
}

/**
 * Get all comments as well as all the users associated with the comments
 * and return the resolved items
 */
export async function fetchComments(spaceId, entryId) {
  const endpoint = createSpaceEndpoint(spaceId);
  const { items: comments } = await getAll(endpoint, entryId);
  const commentCreatorIds = uniq(map(comments, 'sys.createdBy.sys.id'));
  const users = await fetchUsers(spaceId, commentCreatorIds);
  const resolvedComments = resolveLinks({
    paths: ['sys.createdBy'],
    includes: { User: users },
    items: comments
  });
  return resolvedComments;
}
