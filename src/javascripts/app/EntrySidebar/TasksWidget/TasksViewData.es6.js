import PropTypes from 'prop-types';

export const TaskViewData = {
  key: PropTypes.string.isRequired,
  body: PropTypes.string,
  assignee: PropTypes.object,
  creator: PropTypes.object, // TODO: Don't inject domain object.
  createdAt: PropTypes.string,
  isDone: PropTypes.bool,
  isDraft: PropTypes.bool,
  validationMessage: PropTypes.string
};

export const TaskListViewData = {
  statusText: PropTypes.string,
  isLoading: PropTypes.bool,
  errorMessage: PropTypes.string,
  hasCreateAction: PropTypes.bool,
  tasks: PropTypes.arrayOf(PropTypes.shape(TaskViewData)).isRequired
};

const DRAFT_TASK_DATA = {
  key: '<<DRAFT-TASK>>',
  body: '',
  assignee: null,
  creator: null,
  createdAt: null,
  isDone: false,
  isDraft: true,
  validationMessage: null,
  version: 0
};

/**
 * Creates a TaskViewData object that can be used with the TaskList react component.
 *
 * @param {Array<API.Comment>} tasks
 * @param {Object} anotherNaiveStore
 * @returns {TaskListViewData}
 */
export function createTaskListViewData(tasks, { isCreatingDraft, tasksErrors, loadingError }) {
  const draftTasksViewData = isCreatingDraft ? [maybeWithError(DRAFT_TASK_DATA, tasksErrors)] : [];
  return {
    statusText: !tasks
      ? null
      : tasks.length === 0
      ? 'No tasks were defined yet.'
      : `There are ${getPendingTasksCount(tasks)} pending tasks.`,
    isLoading: !loadingError && !tasks,
    errorMessage: loadingError ? `Error ${tasks ? 'syncing' : 'loading'} tasks` : null,
    hasCreateAction: !isCreatingDraft && !loadingError,
    tasks: [
      ...(tasks || []).map(task => createTaskViewData(task, tasksErrors)),
      ...draftTasksViewData
    ]
  };
}

/**
 * @returns {TaskViewData}
 */
export function createLoadingStateTasksViewData() {
  return {
    statusText: null,
    isLoading: true,
    errorMessage: null,
    hasCreateAction: false,
    tasks: []
  };
}

/**
 * @param {API.Comment} task
 * @param {Object}
 * @returns {TaskViewData}
 */
function createTaskViewData(task, tasksErrors) {
  return maybeWithError(
    {
      body: task.body,
      key: task.sys.id,
      assignee: task.sys.assignedTo,
      creator: task.sys.createdBy,
      createdAt: task.sys.createdAt,
      isDone: task.isResolved,
      isDraft: false,
      validationMessage: null,
      version: task.sys.version
    },
    tasksErrors
  );
}

function maybeWithError(taskViewData, tasksErrors) {
  const taskError = tasksErrors && tasksErrors[taskViewData.key];
  const validationMessage = taskError ? taskError.message || 'Unknown error' : null;
  return { ...taskViewData, validationMessage };
}

function getPendingTasksCount(tasks) {
  return tasks.length; // TODO: Update once we have this in backend.
}
