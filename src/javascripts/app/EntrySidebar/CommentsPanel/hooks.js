import { useCallback } from 'react';
import { map, uniq } from 'lodash';
import resolveLinks from 'data/LinkResolver';
import { getSpace, getUserSync } from 'services/TokenStore';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getUsers } from 'access_control/OrganizationMembershipRepository';
import { getAllForEntry, create } from 'data/CMA/CommentsRepo';
import { useAsync, useAsyncFn } from 'core/hooks';
import { trackCommentCreated } from './analytics';

/**
 * Fetches all comments for the given entry.
 * Returns a state object
 * @param {SpaceEndpoint} endpoint
 * @param {string} entryId
 */
export const useCommentsFetcher = (endpoint, entryId) => {
  // avoiding infinite loop.
  const fetch = useCallback(async () => {
    return withMinDelay(fetchCommentsAndUsers(endpoint, entryId));
  }, [endpoint, entryId]);

  return useAsync(fetch);
};

/**
 * Creates a comment in the given entry.
 * Returns a state object and a requester function
 * @param {SpaceEndpoint} endpoint
 * @param {string} entryId
 */
export const useCommentCreator = (endpoint, entryId, parentCommentId) => {
  const user = getUserSync();

  return useAsyncFn(async (body) => {
    const comment = await create(endpoint, entryId, { body, parentCommentId });
    comment.sys.createdBy = user;
    trackCommentCreated();
    return comment;
  });
};

function withMinDelay(promise) {
  const delay = () => new Promise((resolve) => setTimeout(resolve, 700));
  return Promise.all([promise, delay()]).then(([data]) => data);
}

async function fetchUsers(spaceId, userIds) {
  const { organization } = await getSpace(spaceId);
  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  // TODO: handle case where there are too many ids to fit into the query string
  const { items } = await getUsers(orgEndpoint, {
    'sys.id[in]': userIds.join(','),
  });
  return items;
}

/**
 * Get all comments as well as all the users associated with the comments
 * and return the resolved items
 */
export async function fetchCommentsAndUsers(endpoint, entryId) {
  const { spaceId } = endpoint;
  const { items: comments } = await getAllForEntry(endpoint, entryId);
  const commentCreatorIds = uniq(map(comments, 'sys.createdBy.sys.id'));
  const users = commentCreatorIds.length ? await fetchUsers(spaceId, commentCreatorIds) : [];
  const resolvedComments = resolveLinks({
    paths: ['sys.createdBy'],
    includes: { User: users },
    items: comments,
  });
  return resolvedComments;
}
