import PropTypes from 'prop-types';
import { memoize } from 'lodash';
import {
  UserSelectorViewData,
  createSpaceUserSelectorViewData,
  createUserViewDataFromLinkAndFetcher
} from './UserViewData.es6';

export const TaskViewData = {
  key: PropTypes.string,
  version: PropTypes.number,
  body: PropTypes.string,
  assignee: PropTypes.object,
  creator: PropTypes.object, // TODO: Don't inject domain object.
  createdAt: PropTypes.string,
  isDone: PropTypes.bool,
  isDraft: PropTypes.bool,
  isInEditMode: PropTypes.bool,
  validationMessage: PropTypes.string,
  assignableUsersInfo: PropTypes.shape(UserSelectorViewData)
};

export const TaskListViewData = {
  statusText: PropTypes.string,
  isLoading: PropTypes.bool,
  errorMessage: PropTypes.string,
  hasCreateAction: PropTypes.bool,
  tasks: PropTypes.arrayOf(PropTypes.shape(TaskViewData)).isRequired
};

const DRAFT_TASK_KEY = '<<DRAFT-TASK>>';

const DRAFT_TASK = {
  sys: {
    id: DRAFT_TASK_KEY,
    version: 0,
    createdBy: null,
    createdAt: null
  },
  body: '',
  assignedTo: null,
  status: 'open'
};

/**
 * Creates a TaskViewData object that can be used with the TaskList react component.
 *
 * @param {Object} tasksFetchingStatus
 * @param {Object} usersFetchingStatus
 * @param {Object} .tasksInEditMode
 * @param {Object} .tasksErrors
 * @returns {TaskListViewData}
 */
export function createTaskListViewData(
  tasksFetchingStatus,
  usersFetchingStatus,
  { tasksInEditMode, tasksErrors }
) {
  if (!tasksFetchingStatus || tasksFetchingStatus.isLoading) {
    return createLoadingStateTasksViewData();
  }
  const getSpaceUsersSelectorVD = memoize(() =>
    createSpaceUserSelectorViewData(usersFetchingStatus)
  );

  const { data: tasks, error: loadingError } = tasksFetchingStatus;
  const isCreatingDraft = tasksInEditMode[DRAFT_TASK_KEY];
  const draftTasksVD = isCreatingDraft ? [newTaskVD(DRAFT_TASK)] : [];
  return {
    statusText: !tasks
      ? null
      : tasks.length === 0
      ? 'No tasks were defined yet.'
      : `There are ${getPendingTasksCount(tasks)} pending tasks.`,
    isLoading: tasksFetchingStatus.isLoading && !tasks,
    errorMessage: loadingError ? `Error ${tasks ? 'syncing' : 'loading'} tasks` : null,
    hasCreateAction: !isCreatingDraft && !loadingError,
    tasks: [...(tasks || []).map(newTaskVD), ...draftTasksVD]
  };

  function newTaskVD(task) {
    const { id } = task.sys;
    let taskVD = createTaskViewData(task, usersFetchingStatus);

    const spaceUsersSelectorVD = getSpaceUsersSelectorVD();

    if (tasksInEditMode[id]) {
      taskVD = decorateTaskViewDataWithEditMode(taskVD, spaceUsersSelectorVD);
    }
    const error = tasksErrors[id];
    if (error) {
      taskVD = decorateTaskViewDataWithError(taskVD, error);
    }

    return taskVD;
  }
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
 * @param {Object} usersFetchingStatus
 * @returns {TaskViewData}
 */
function createTaskViewData(task, usersFetchingStatus) {
  const { id } = task.sys;
  const assignee = task.assignedTo
    ? createUserViewDataFromLinkAndFetcher(task.assignedTo, usersFetchingStatus)
    : null;
  const creator = task.sys.createdBy
    ? createUserViewDataFromLinkAndFetcher(task.sys.createdBy, usersFetchingStatus)
    : null;

  return {
    key: id,
    version: task.sys.version,
    createdAt: task.sys.createdAt,
    creator,
    assignee,
    body: task.body,
    isDone: task.status === 'resolved',
    isDraft: id === DRAFT_TASK_KEY,
    isInEditMode: false,
    assignableUsersInfo: null,
    validationMessage: null
  };
}

function decorateTaskViewDataWithError(taskVD, taskError) {
  const validationMessage = taskError.message || 'Unknown error';
  return { ...taskVD, validationMessage };
}

function decorateTaskViewDataWithEditMode(taskVD, usersSelectorVD) {
  return {
    ...taskVD,
    isInEditMode: true,
    assignableUsersInfo: {
      ...usersSelectorVD,
      selectedUser: taskVD.assignee
    }
  };
}

function getPendingTasksCount(tasks) {
  return tasks.filter(task => task.status === 'open').length;
}
