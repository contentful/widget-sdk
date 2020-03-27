import * as K from 'utils/kefir';
import { getAllForEntry, create, remove, update } from 'data/CMA/TasksRepo';
// TODO: Introduce Store specific errors rather than passing client errors.

/**
 * Creates a task store containing all an entry's tasks.
 *
 * NOTE: Does currently not sync with the API, so there might be new tasks created
 *  or existing ones updated since the store creation.
 *
 * @param {SpaceEndpoint} endpoint
 * @param {string} entryId
 * @returns {TaskStore}
 */
export function createTasksStoreForEntry(endpoint, entryId) {
  const tasksBus = K.createPropertyBus(null);
  const items$ = tasksBus.property;
  const getItems = () => K.getValue(items$);

  initialFetch();

  return {
    items$,
    add: async (task) => {
      const { sys: _sys, ...data } = task;
      const newTask = await create(endpoint, entryId, data);

      tasksBus.set([...getItems(), newTask]);
      return newTask;
    },
    remove: async (taskId) => {
      const task = getItems().find((task) => task.sys.id === taskId);
      await remove(endpoint, entryId, task);
      tasksBus.set(getItems().filter((task) => task.sys.id !== taskId));
    },
    update: async (task) => {
      const updatedTask = await update(endpoint, entryId, task);
      tasksBus.set(
        getItems().map((task) => (task.sys.id === updatedTask.sys.id ? updatedTask : task))
      );
    },
    destroy: () => tasksBus.end(),
  };

  async function initialFetch() {
    try {
      tasksBus.set(await getAllForEntry(endpoint, entryId));
    } catch (error) {
      tasksBus.error(error);
    }
  }
}
