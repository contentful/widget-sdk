const path = (entryId, taskId) => ['entries', entryId, 'tasks', ...(taskId ? [taskId] : [])];

export const TaskStatus = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
};

/**
 * Returns all of an entry's tasks.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @returns {Promise<API.Task>}
 */
export const getAllForEntry = async (endpoint, entryId) => {
  const result = await endpoint({
    method: 'GET',
    path: path(entryId),
  });
  return result.items;
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
  endpoint({
    method: 'POST',
    path: path(entryId),
    data: task,
  });

/**
 * Deletes a task.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {String} entryId
 * @param {API.Task} task
 */
export const remove = async (endpoint, entryId, task) =>
  endpoint(
    {
      method: 'DELETE',
      path: path(entryId, task.sys.id),
    },
    { 'X-Contentful-Version': task.sys.version }
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
  return endpoint(
    {
      method: 'PUT',
      path: path(entryId, sys.id),
      data: taskDetails,
    },
    { 'X-Contentful-Version': sys.version }
  );
}
