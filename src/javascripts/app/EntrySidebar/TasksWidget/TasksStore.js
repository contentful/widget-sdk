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
    add: async task => {
      let newTask;
      const { sys: _sys, ...data } = task;
      try {
        newTask = await create(endpoint, entryId, data);
      } catch (error) {
        throw error;
      }
      tasksBus.set([...getItems(), newTask]);
      return newTask;
    },
    remove: async taskId => {
      try {
        const task = getItems().find(task => task.sys.id === taskId);
        await remove(endpoint, entryId, task);
      } catch (error) {
        throw error;
      }
      tasksBus.set(getItems().filter(task => task.sys.id !== taskId));
    },
    update: async task => {
      let updatedTask;
      try {
        updatedTask = await update(endpoint, entryId, task);
      } catch (error) {
        throw error;
      }
      tasksBus.set(
        getItems().map(task => (task.sys.id === updatedTask.sys.id ? updatedTask : task))
      );
    },
    destroy: () => tasksBus.end()
  };

  async function initialFetch() {
    try {
      tasksBus.set(await getAllForEntry(endpoint, entryId));
    } catch (error) {
      tasksBus.error(error);
    }
  }
}
