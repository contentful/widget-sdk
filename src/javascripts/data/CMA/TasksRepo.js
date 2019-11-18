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
 * @param {Boolean} isPrePreview
 * @returns {Promise<API.Task>}
 */
export async function create(endpoint, entryId, task, isPrePreview) {
  const { body, assignedTo, status: uiStatus } = task;
  const status = isPrePreview && uiStatus === TaskStatus.ACTIVE ? 'open' : uiStatus;
  const data = isPrePreview ? { body, assignment: { assignedTo, status } } : task;
  return endpoint(
    {
      method: 'POST',
      path: path(entryId),
      data
    },
    alphaHeader
  );
}

/**
 * Returns all of an entry's tasks.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @returns {Promise<API.Task>}
 */
export async function getAllForEntry(endpoint, entryId) {
  return endpoint(
    {
      method: 'GET',
      path: path(entryId)
    },
    alphaHeader
  );
}

/**
 * Deletes a task.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {String} taskId
 */
export async function remove(endpoint, entryId, taskId) {
  return endpoint(
    {
      method: 'DELETE',
      path: path(entryId, taskId)
    },
    alphaHeader
  );
}

/**
 * Updates a task.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {API.Task} task
 * @param {Boolean} isPrePreview
 * @returns {Promise<API.Task>}
 */
export async function update(endpoint, entryId, task, isPrePreview) {
  const { sys, body, assignedTo, status: uiStatus } = task;
  const status = isPrePreview && uiStatus === TaskStatus.ACTIVE ? 'open' : uiStatus;
  const assignment = { assignedTo, status };
  const data = isPrePreview ? { body, assignment } : { body, ...assignment };
  const headers = {
    'X-Contentful-Version': sys.version,
    ...alphaHeader
  };
  return endpoint(
    {
      method: 'PUT',
      path: path(entryId, task.sys.id),
      data
    },
    headers
  );
}
