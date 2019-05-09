import PropTypes from 'prop-types';

const TaskViewData = {
  helpText: PropTypes.string,
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
 * @param {API.Comment>} comments
 * @returns TaskViewData{}
 */
export function createTasksViewData(comments = []) {
  // TODO: Filter out comments that aren't assigned (normal comments) once the backend
  //  supports assignable comments (aka. tasks).
  const tasks = comments.filter(comment => comment);

  return {
    helpText: tasks.length === 0 ? 'No tasks were defined yet.' : undefined,
    tasks: tasks.map(task => ({
      key: task.sys.id
      // TODO: Add more stuff from comments into this view data object.
    }))
  };
}
