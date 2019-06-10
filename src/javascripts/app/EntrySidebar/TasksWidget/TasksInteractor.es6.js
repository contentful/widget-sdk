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
 * @param {function} getState
 * @returns {TasksInteractor}
 */
export function createTasksStoreInteractor(tasksStore, setState, getState) {
  const setIsCreatingDraft = value => setState({ isCreatingDraft: value });
  const setTaskError = (key, error) => {
    const { tasksErrors = {} } = getState();
    tasksErrors[key] = error;
    setState({ tasksErrors });
  };
  const resetTaskError = key => setTaskError(key, null);

  return {
    startTaskDraft() {
      setIsCreatingDraft(true);
    },
    cancelTaskDraft() {
      setIsCreatingDraft(false);
      resetTaskError('<<DRAFT-TASK>>');
    },
    async saveTaskDraft(key, body, assigneeUserId) {
      resetTaskError('<<DRAFT-TASK>>');
      const assignedTo = createUserLink(assigneeUserId);
      const task = { body, assignedTo };
      try {
        await tasksStore.add(task);
      } catch (error) {
        setTaskError(key, error);
        return;
      }
      setIsCreatingDraft(false);
    },
    async deleteTask(key) {
      resetTaskError(key);
      try {
        await tasksStore.remove(key);
      } catch (error) {
        setTaskError(key, error);
      }
    },
    async updateTask(key, { version, body }) {
      resetTaskError(key);
      try {
        await tasksStore.update({
          sys: { id: key, version },
          body
        });
      } catch (error) {
        setTaskError(key, error);
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
