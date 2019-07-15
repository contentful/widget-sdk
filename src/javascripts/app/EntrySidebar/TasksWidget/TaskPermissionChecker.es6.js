/**
 * Creates a service that exposes some functions for Task permission
 * checking.
 *
 * TODO: Consider using Worf instead and move into `AccessChecker`.
 *
 * @param {API.User} currentUser
 * @returns {TaskPermissionChecker}
 */
export default function create(currentUser) {
  if (!currentUser || !currentUser.sys) {
    throw new Error('Expect `currentUser` to be a User object');
  }
  const currentUserId = getUserId(currentUser);
  const isSpaceAdmin = false; // TODO: !!! Get this information for real !!!

  return {
    canEdit,
    canUpdateStatus
  };

  function canEdit(task) {
    return isSpaceAdmin || isTaskCreator(task);
  }

  function canUpdateStatus(task) {
    return isSpaceAdmin || isTaskCreator(task) || isTaskAssignee(task);
  }

  function isTaskCreator(task) {
    return !!task.sys && !!task.sys.createdBy && getUserId(task.sys.createdBy) === currentUserId;
  }

  function isTaskAssignee(task) {
    return (
      !!task.assignment &&
      !!task.assignment.assignedTo &&
      getUserId(task.assignment.assignedTo) === currentUserId
    );
  }

  function getUserId(user) {
    return user.sys.id;
  }
}

/**
 * Returns a TaskPermissionChecker that returns `false` for each check.
 *
 * @returns {TaskPermissionChecker}
 */
export function createProhibitive() {
  return {
    canEdit: () => false,
    canUpdateStatus: () => false
  };
}
