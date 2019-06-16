import PropTypes from 'prop-types';

export const TaskViewData = {
  key: PropTypes.string,
  body: PropTypes.string,
  assignee: PropTypes.object,
  creator: PropTypes.object, // TODO: Don't inject domain object.
  createdAt: PropTypes.string,
  isDone: PropTypes.bool,
  isDraft: PropTypes.bool,
  isInEditMode: PropTypes.bool,
  validationMessage: PropTypes.string
};

export const TaskListViewData = {
  statusText: PropTypes.string,
  isLoading: PropTypes.bool,
  errorMessage: PropTypes.string,
  hasCreateAction: PropTypes.bool,
  tasks: PropTypes.arrayOf(PropTypes.shape(TaskViewData)).isRequired
};

const DRAFT_TASK_KEY = '<<DRAFT-TASK>>';

const DRAFT_TASK_DATA = {
  key: DRAFT_TASK_KEY,
  body: '',
  assignee: null,
  creator: null,
  createdAt: null,
  isDone: false,
  isDraft: true,
  isInEditMode: true,
  validationMessage: null,
  version: 0
};

/**
 * Creates a TaskViewData object that can be used with the TaskList react component.
 *
 * @param {Array<API.Comment>} tasks
 * @param {Object} tasksInEditMode
 * @param {Object} tasksErrors
 * @param {Object} loadingError
 * @returns {TaskListViewData}
 */
export function createTaskListViewData(tasks, { tasksInEditMode, tasksErrors, loadingError }) {
  const isCreatingDraft = tasksInEditMode[DRAFT_TASK_KEY];
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
      ...(tasks || []).map(task => createTaskViewData(task, tasksInEditMode, tasksErrors)),
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
function createTaskViewData(task, tasksInEditMode, tasksErrors) {
  const { id } = task.sys;
  return maybeWithError(
    {
      body: task.body,
      key: id,
      assignee: task.sys.assignedTo,
      creator: task.sys.createdBy,
      createdAt: task.sys.createdAt,
      isDone: task.isResolved,
      isDraft: false,
      isInEditMode: !!tasksInEditMode[id],
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
