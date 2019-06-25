import * as K from 'utils/kefir.es6';
import { getAll, create, remove, update } from 'data/CMA/CommentsRepo.es6';
import { getUserSync } from 'services/TokenStore.es6';

export function createTasksStoreForEntry(endpoint, entryId) {
  const currentUser = getUserSync();
  const tasksBus = K.createPropertyBus(null);
  const items$ = tasksBus.property;
  const getItems = () => K.getValue(items$);

  // TODO: Remove mock user stuff once we have assignedTo in backend:
  let mocksCount = 0;
  const mockUsers = [
    createUserLink(currentUser.sys.id),
    createUserLink('59fjBVO6euH3jBh9DW92js'), // Danny's user on Flinkly
    createUserLink('non_existant_user_id')
  ];

  initialFetch();

  return {
    items$,
    add: async task => {
      let newTask;
      try {
        newTask = await create(endpoint, entryId, task.body, null);
      } catch (error) {
        throw error;
      }
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
      const updatedMockTask = toMockTask(updatedTask);
      tasksBus.set(
        getItems().map(task => (task.sys.id === updatedTask.sys.id ? updatedMockTask : task))
      );
    },
    destroy: () => tasksBus.end()
  };

  async function initialFetch() {
    let comments;
    try {
      const { items } = await getAll(endpoint, entryId);
      comments = items;
    } catch (error) {
      tasksBus.error(error);
    }

    if (comments) {
      const tasksOrComments = comments.map(toMockTask);
      const tasks = tasksOrComments.filter(isTaskComment);
      tasksBus.set(tasks);
    }
  }

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
    const mockUserLink = mockUsers[mocksCount++ % mockUsers.length];
    return {
      assignedTo: mockUserLink,
      isResolved: false, // TODO: Rename this to what we will use in API.
      status: 'open',
      ...comment
    };
  }
}

function isTaskComment(comment) {
  return !!(comment && comment.assignedTo);
}

function createUserLink(id) {
  return { sys: { type: 'Link', linkType: 'User', id } };
}
