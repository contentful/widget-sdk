import { COMMENTS_API, getAlphaHeader } from 'alphaHeaders.js';

// Re-uses the old comments-api alpha flag.
const alphaHeader = getAlphaHeader(COMMENTS_API);

const path = (entryId, taskId) => ['entries', entryId, 'tasks', ...(taskId ? [taskId] : [])];

export const TaskStatus = {
  ACTIVE: 'active',
  RESOLVED: 'resolved'
};

export function transformTask(task) {
  if (task.assignment) {
    Object.assign(task, task.assignment);
    delete task.assignment;
  }

  if (task.sys.commentType) {
    delete task.sys.commentType;
  }
  if (task.sys.reference) {
    Object.assign(task.sys, { parentEntity: task.sys.reference });
    delete task.sys.reference;
  }

  if (task.status === 'open') {
    task.status = TaskStatus.ACTIVE;
  }

  return task;
}

export const transformTaskArray = tasks => tasks.items.map(transformTask);

/**
 * Creates a new task on a specific entry.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {Object} data Task data without `sys`
 * @returns {Promise<API.Task>}
 */
export const create = async (endpoint, entryId, task) =>
  transformTask(
    await endpoint(
      {
        method: 'POST',
        path: path(entryId),
        data: {
          ...task,
          // Add assignment: will be ignored by new API but required by the deprecated one
          assignment: {
            assignedTo: task.assignedTo,
            status: task.status === TaskStatus.ACTIVE ? 'open' : task.status
          }
        }
      },
      alphaHeader
    )
  );

/**
 * Returns all of an entry's tasks.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @returns {Promise<API.Task>}
 */
export const getAllForEntry = async (endpoint, entryId) =>
  transformTaskArray(
    await endpoint(
      {
        method: 'GET',
        path: path(entryId)
      },
      alphaHeader
    )
  );

/**
 * Deletes a task.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {String} taskId
 */
export const remove = (endpoint, entryId, taskId) =>
  endpoint(
    {
      method: 'DELETE',
      path: path(entryId, taskId)
    },
    alphaHeader
  );

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
  return transformTask(
    await endpoint(
      {
        method: 'PUT',
        path: path(entryId, sys.id),
        data: {
          ...taskDetails,
          // Add assignment: will be ignored by new API but required by the deprecated one
          assignment: {
            assignedTo: task.assignedTo,
            status: task.status === TaskStatus.ACTIVE ? 'open' : task.status
          }
        }
      },
      headers
    )
  );
}
