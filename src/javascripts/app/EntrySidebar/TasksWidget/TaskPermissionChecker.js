export const MissingCurrentUserError = new TypeError('Expected `currentUser` to be a User object');

/**
 * Creates a service that exposes some functions for Task permission
 * checking.
 *
 * TODO: Consider using Worf instead and move into `AccessChecker`.
 *
 * @param {API.User} currentUser
 * @param {boolean} isSpaceUser
 * @returns {TaskPermissionChecker}
 */
export default function create(currentUser, isSpaceAdmin) {
  if (!currentUser || !currentUser.sys) {
    throw MissingCurrentUserError;
  }
  const currentUserId = getUserId(currentUser);

  return {
    canEdit,
    canUpdateStatus,
  };

  function canEdit(task) {
    return isSpaceAdmin || isTaskCreator(task);
  }

  function canUpdateStatus(task) {
    return isSpaceAdmin || isTaskAssignee(task);
  }

  function isTaskCreator(task) {
    return !!task.sys && !!task.sys.createdBy && getUserId(task.sys.createdBy) === currentUserId;
  }

  function isTaskAssignee(task) {
    return !!task.assignedTo && getUserId(task.assignedTo) === currentUserId;
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
    canUpdateStatus: () => false,
  };
}
