import PropTypes from 'prop-types';

const TasksInteractor = {
  startTaskDraft: PropTypes.func.isRequired,
  startEditingTask: PropTypes.func.isRequired,
  cancelTaskChanges: PropTypes.func.isRequired,
  saveTaskChanges: PropTypes.func.isRequired,
  deleteTask: PropTypes.func.isRequired
};
export default TasksInteractor;

const DRAFT_KEY = '<<DRAFT-TASK>>';

/**
 * @param {TasksStore} tasksStore
 * @param {function} setState
 * @param {function} getState
 * @returns {TasksInteractor}
 */
export function createTasksStoreInteractor(tasksStore, setState, getState) {
  const setIsBeingEdited = (key, isInEditMode) => {
    const { tasksInEditMode = {} } = getState();
    setState({ tasksInEditMode: { ...tasksInEditMode, [key]: isInEditMode } });
  };
  const setTaskError = (key, error) => {
    const { tasksErrors = {} } = getState();
    setState({ tasksErrors: { ...tasksErrors, [key]: error } });
  };
  const resetTaskError = key => setTaskError(key, null);

  return {
    startTaskDraft() {
      setIsBeingEdited(DRAFT_KEY, true);
    },
    startEditingTask(key) {
      setIsBeingEdited(key, true);
    },
    cancelTaskChanges(key) {
      setIsBeingEdited(key, false);
      resetTaskError(key);
    },
    async saveTaskChanges(key, { body, assigneeUserId, version = 0 }) {
      resetTaskError(key);
      const assignedTo = createUserLink(assigneeUserId);
      const task = { body, assignedTo };
      const store =
        version > 0
          ? () => tasksStore.update({ sys: { id: key, version }, ...task })
          : () => tasksStore.add(task);
      try {
        await store();
      } catch (error) {
        setTaskError(key, error);
        return;
      }
      setIsBeingEdited(key, false);
    },
    async deleteTask(key) {
      resetTaskError(key);
      try {
        await tasksStore.remove(key);
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
