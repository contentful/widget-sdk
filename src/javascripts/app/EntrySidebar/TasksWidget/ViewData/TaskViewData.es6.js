import PropTypes from 'prop-types';
import { memoize } from 'lodash';
import { isOpenTask } from '../util.es6';
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
  creator: PropTypes.object,
  createdAt: PropTypes.string,
  isDone: PropTypes.bool,
  isDraft: PropTypes.bool,
  isInEditMode: PropTypes.bool,
  canEdit: PropTypes.bool,
  canUpdateStatus: PropTypes.bool,
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
  assignment: {
    assignedTo: null,
    status: 'open'
  }
};

/**
 * Creates a TaskViewData object that can be used with the TaskList react component.
 *
 * @param {Object} tasksFetchingStatus
 * @param {Object} usersFetchingStatus
 * @param {Object} .tasksInEditMode
 * @param {Object} .tasksErrors
 * @param {TaskPermissionChecker} permissionChecker
 * @returns {TaskListViewData}
 */
export function createTaskListViewData(
  tasksFetchingStatus,
  usersFetchingStatus,
  { tasksInEditMode, tasksErrors },
  permissionChecker
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
    statusText: tasks ? getPendingTasksMessage(tasks) : null,
    isLoading: tasksFetchingStatus.isLoading && !tasks,
    errorMessage: loadingError ? `Error ${tasks ? 'syncing' : 'loading'} tasks` : null,
    hasCreateAction: !isCreatingDraft && !loadingError,
    tasks: [...(tasks || []).map(newTaskVD), ...draftTasksVD]
  };

  function newTaskVD(task) {
    const { id } = task.sys;
    let taskVD = createTaskViewData(task, usersFetchingStatus);

    if (tasksInEditMode[id]) {
      const spaceUsersSelectorVD = getSpaceUsersSelectorVD();
      taskVD = decorateTaskViewDataWithEditMode(taskVD, spaceUsersSelectorVD);
    }
    const error = tasksErrors[id];
    if (error) {
      taskVD = decorateTaskViewDataWithError(taskVD, error);
    }
    taskVD.canEdit = permissionChecker.canEdit(task);
    taskVD.canUpdateStatus = permissionChecker.canUpdateStatus(task);

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
 * @param {API.Task} task
 * @param {Object} usersFetchingStatus
 * @returns {TaskViewData}
 */
function createTaskViewData(task, usersFetchingStatus) {
  const { id } = task.sys;
  const assignee = task.assignment.assignedTo
    ? createUserViewDataFromLinkAndFetcher(task.assignment.assignedTo, usersFetchingStatus)
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
    isDone: task.assignment.status === 'resolved',
    isDraft: id === DRAFT_TASK_KEY,
    isInEditMode: false,
    canEdit: false,
    canUpdateStatus: false,
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

function getPendingTasksMessage(tasks) {
  if (tasks.length === 0) {
    return 'No tasks have been defined yet.';
  }
  const count = getPendingTasksCount(tasks);
  return count === 0
    ? 'There are no pending tasks'
    : count === 1
    ? 'There is 1 pending task'
    : `There are ${count} pending tasks`;
}

function getPendingTasksCount(tasks) {
  return tasks.filter(isOpenTask).length;
}
