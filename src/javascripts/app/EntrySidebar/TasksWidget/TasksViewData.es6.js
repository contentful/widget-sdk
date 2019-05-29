import PropTypes from 'prop-types';

const TaskViewData = {
  helpText: PropTypes.string,
  isLoading: PropTypes.bool,
  hasNewTaskForm: PropTypes.bool,
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired
};
export default TaskViewData;

/**
 * Creates a TaskViewData object that can be used with the TasksWidget react component.
 *
 * @param {Array<API.Comment>} comments
 * @returns {TaskViewData}
 */
export function createTasksViewDataFromComments(comments = []) {
  // TODO: Filter out comments that aren't assigned (normal comments) once the backend
  //  supports assignable comments (aka. tasks).
  const tasks = comments.filter(comment => comment);

  return {
    helpText:
      tasks.length === 0
        ? 'No tasks were defined yet.'
        : `There are ${tasks.length} pending tasks.`,
    isLoading: false,
    hasNewTaskForm: false,
    tasks: tasks.map(task => ({
      body: task.body,
      key: task.sys.id,
      assignedTo: task.sys.createdBy, // TODO: Replace with assigned to information
      createdBy: task.sys.createdBy,
      createdAt: task.sys.createdAt,
      resolved: false, // TODO: Replace with resolved flag
      isDraft: false,
      validationMessage: ''
      // TODO: Add more stuff from comments into this view data object.
    }))
  };
}

/**
 * @returns {TaskViewData}
 */
export function createLoadingStateTasksViewData() {
  return {
    helpText: 'Loading...', // TODO: Probably shouldn't just be a help text.
    isLoading: true,
    hasNewTaskForm: false,
    tasks: []
  };
}
