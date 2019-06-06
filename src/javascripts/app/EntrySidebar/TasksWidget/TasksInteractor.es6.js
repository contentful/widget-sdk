import PropTypes from 'prop-types';

const TasksInteractor = {
  startTaskDraft: PropTypes.func.isRequired,
  cancelTaskDraft: PropTypes.func.isRequired,
  saveTaskDraft: PropTypes.func.isRequired,
  deleteTask: PropTypes.func.isRequired,
  updateTask: PropTypes.func.isRequired
};
export default TasksInteractor;

/**
 * @param {TasksStore} tasksStore
 * @param {function} setState
 * @returns {TasksInteractor}
 */
export function createTasksStoreInteractor(tasksStore, setState) {
  const setIsCreatingDraft = value => setState({ isCreatingDraft: value });

  return {
    startTaskDraft() {
      setIsCreatingDraft(true);
    },
    cancelTaskDraft() {
      setIsCreatingDraft(false);
    },
    async saveTaskDraft(body, assigneeUserId) {
      const assignedTo = createUserLink(assigneeUserId);
      const task = { body, assignedTo };
      try {
        await tasksStore.add(task);
      } catch (e) {
        // TODO
        return;
      }
      setIsCreatingDraft(false);
    },
    deleteTask(key) {
      try {
        tasksStore.remove(key);
      } catch (e) {
        // TODO
        return;
      }
    },
    updateTask(key, { version, body }) {
      try {
        tasksStore.update({
          sys: { id: key, version },
          body
        });
      } catch (e) {
        // TODO
        return;
      }
    }
  };
}

function createUserLink(id) {
  return {
    sys: {
      type: 'Link',
      linkType: 'User',
      id
    }
  };
}
