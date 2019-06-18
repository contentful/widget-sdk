import * as K from 'utils/kefir.es6';
// TODO: Don't rely on the comment hooks:
import { fetchComments } from '../CommentsPanel/hooks.es6';
import { create, remove, update } from 'data/CMA/CommentsRepo.es6';
import { getUserSync } from 'services/TokenStore.es6';

export function createTasksStoreForEntry(endpoint, entryId) {
  const { spaceId } = endpoint;
  const currentUser = getUserSync();
  const tasksBus = K.createPropertyBus(null);
  const items$ = tasksBus.property;
  const getItems = () => K.getValue(items$);

  // TODO: Users should NOT be resolved at this level, move outside!
  fetchComments(spaceId, entryId).then(
    commentsWithResolvedUsers => {
      // TODO: Exclude non-Task comments once backend supports them.
      const tasksWithResolvedUsers = commentsWithResolvedUsers.map(toMockTask);
      tasksBus.set(tasksWithResolvedUsers);
    },
    error => {
      tasksBus.error(error);
    }
  );

  return {
    items$,
    add: async task => {
      let newTask;
      try {
        newTask = await create(endpoint, entryId, task.body, null);
      } catch (error) {
        throw error;
      }
      newTask.sys.createdBy = currentUser; // TODO: Don't resolve users in here (see above)
      const newMockTask = toMockTask(newTask);
      tasksBus.set([...getItems(), newMockTask]);
      return newMockTask;
    },
    remove: async taskId => {
      try {
        await remove(endpoint, entryId, taskId);
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
        // TODO: Introduce Store specific errors rather than passing client errors.
        throw error;
      }
      tasksBus.set(
        getItems().map(task => (task.sys.id === updatedTask.sys.id ? updatedTask : task))
      );
    }
  };

  /**
   * Mocks task specific properties of the comment that are not yet given by the API.
   * This allows us to treat comments like tasks in the rest of the code base.
   *
   * TODO: Remove once we have backend for this.
   *
   * @param {API.Comment} comment
   * @returns {API.Task}
   */
  function toMockTask(comment) {
    return {
      isResolved: false,
      ...comment,
      sys: {
        assignedTo: currentUser, // TODO: Should just be a link, not a whole User object.
        ...comment.sys
      }
    };
  }
}
