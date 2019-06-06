import PropTypes from 'prop-types';

const TaskViewData = {
  helpText: PropTypes.string,
  isLoading: PropTypes.bool,
  showCreateAction: PropTypes.bool,
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired
};
export default TaskViewData;

// TODO: Remove
const user = {
  firstName: 'Mike',
  lastName: 'Mitchell',
  avatarUrl:
    'https://www.gravatar.com/avatar/02c899bec697256cc19c993945ce9b1e?s=50&d=https%3A%2F%2Fstatic.flinkly.com%2Fgatekeeper%2Fusers%2Fdefault-a4327b54b8c7431ea8ddd9879449e35f051f43bd767d83c5ff351aed9db5986e.png',
  sys: {
    createdAt: '2018-11-02T10:07:46Z',
    updatedAt: '2019-05-08T08:58:33Z'
  }
};

const DRAFT_TASK_DATA = {
  isDraft: true,
  body: '',
  key: `<<DRAFT-TASK>>`,
  version: 0,
  assignedTo: {},
  createdBy: user,
  createdAt: `${new Date().toISOString()}`,
  resolved: false
};

/**
 * Creates a TaskViewData object that can be used with the TasksWidget react component.
 *
 * @param {Array<API.Comment>} tasks
 * @returns {TaskViewData}
 */
export function createTasksViewDataFromComments(tasks, { isCreatingDraft }) {
  const pendingTasksCount = tasks.length; // Update once we have this in backend.
  const draftTasksViewData = isCreatingDraft ? [DRAFT_TASK_DATA] : [];

  return {
    helpText:
      tasks.length === 0
        ? 'No tasks were defined yet.'
        : `There are ${pendingTasksCount} pending tasks.`,
    isLoading: false,
    showCreateAction: !isCreatingDraft,
    tasks: [...tasks.map(createTaskViewData), ...draftTasksViewData]
  };
}

function createTaskViewData(task) {
  return {
    body: task.body,
    key: task.sys.id,
    version: task.sys.version,
    assignedTo: task.sys.createdBy, // TODO: Replace with assigned to information
    createdBy: task.sys.createdBy,
    createdAt: task.sys.createdAt,
    resolved: false, // TODO: Replace with resolved flag
    isDraft: false,
    validationMessage: ''
    // TODO: Add more stuff from comments into this view data object.
  };
}

/**
 * @returns {TaskViewData}
 */
export function createLoadingStateTasksViewData() {
  return {
    isLoading: true,
    showCreateAction: false,
    tasks: []
  };
}
