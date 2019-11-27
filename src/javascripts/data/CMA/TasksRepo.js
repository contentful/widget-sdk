import { COMMENTS_API, getAlphaHeader } from 'alphaHeaders.js';

// Re-uses the old comments-api alpha flag.
const alphaHeader = getAlphaHeader(COMMENTS_API);

const path = (entryId, taskId) => ['entries', entryId, 'tasks', ...(taskId ? [taskId] : [])];

export const TaskStatus = {
  ACTIVE: 'active',
  RESOLVED: 'resolved'
};

/**
 * Creates a new task on a specific entry.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {Object} data Task data without `sys`
 * @returns {Promise<API.Task>}
 */
export const create = async (endpoint, entryId, task) =>
  endpoint(
    {
      method: 'POST',
      path: path(entryId),
      data: task
    },
    alphaHeader
  );

/**
 * Returns all of an entry's tasks.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @returns {Promise<API.Task>}
 */
export const getAllForEntry = async (endpoint, entryId) => {
  const result = await endpoint(
    {
      method: 'GET',
      path: path(entryId)
    },
    alphaHeader
  );
  return result.items;
};

/**
 * Deletes a task.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {API.Task} task
 */
export const remove = (endpoint, entryId, task) => {
  const headers = {
    'X-Contentful-Version': task.sys.version,
    ...alphaHeader
  };
  return endpoint(
    {
      method: 'DELETE',
      path: path(entryId, task.sys.id)
    },
    headers
  );
};

/**
 * Updates a task.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {API.Task} task
 * @returns {Promise<API.Task>}
 */
export async function update(endpoint, entryId, task) {
  const { sys, ...taskDetails } = task;
  const headers = {
    'X-Contentful-Version': sys.version,
    ...alphaHeader
  };
  return endpoint(
    {
      method: 'PUT',
      path: path(entryId, sys.id),
      data: taskDetails
    },
    headers
  );
}
