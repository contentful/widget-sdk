import { registerDirective, registerController, registerFactory } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfUserList', ['UserListController/jumpToRole', '$timeout']);

  registerController('UserListController', [
    '$scope',
    'spaceContext',
    'access_control/AccessChecker',
    'access_control/Users/UserListActions.es6',
    () => {
      // const userListHandler = UserListHandler.create();
      // const actions = UserListActions.create(spaceContext, userListHandler, TokenStore);
      //
      // const organization = spaceContext.organization;
      // const orgId = organization.sys.id;
      // $scope.props = {
      // canModifyUsers: accessChecker.canModifyUsers(),
      // openSpaceInvitationDialog,
      // orgId,
      // isOwnerOrAdmin: isOwnerOrAdmin(organization),
      // openRemovalConfirmationDialog: decorateWithReload(actions.openRemovalConfirmationDialog),
      // openRoleChangeDialog: decorateWithReload(actions.openRoleChangeDialog)
      // };
      //
      // getOrgFeature(orgId, 'teams', false).then(value => {
      //   $scope.props.hasTeamsFeature = value;
      // });
      //
      // reload();
      //
      // function decorateWithReload(command) {
      //   return function(...args) {
      //     return command(...args).then(reload);
      //   };
      // }
      //
      // function openSpaceInvitationDialog() {
      //   $scope.props.isInvitingUsersToSpace = true;
      //
      //   decorateWithReload(actions.openSpaceInvitationDialog)().finally(() => {
      //     $scope.props.isInvitingUsersToSpace = false;
      //   });
      // }
      //
      // /**
      //  * Reset the list with a new data
      //  */
      // function reload() {
      //   return (
      //     userListHandler
      //       .reset()
      //       .then(onResetResponse, accessChecker.wasForbidden($scope.context))
      //       // Refresh token in case the changes affected current user.
      //       // TODO - handle this in the user action
      //       .finally(TokenStore.refresh())
      //       .catch(ReloadNotification.basicErrorHandler)
      //   );
      // }
      //
      // function onResetResponse() {
      //   $scope.props = {
      //     ...$scope.props,
      //     spaceUsersCount: userListHandler.getUserCount(),
      //     userGroupsByView: userListHandler.getGroupedUsers()
      //   };
      //   $scope.context.ready = true;
      // }
    }
  ]);

  registerFactory('UserListController/jumpToRole', [
    '$state',
    'spaceContext',
    ($state, spaceContext) => {
      let targetRoleId = null;

      jump.popRoleId = popRoleId;
      return jump;

      function jump(roleId) {
        targetRoleId = roleId;
        if (spaceContext.isMasterEnvironment()) {
          $state.go('spaces.detail.settings.users.list');
        } else {
          $state.go('spaces.detail.environment.settings.users.list');
        }
      }

      function popRoleId() {
        const roleId = targetRoleId;
        targetRoleId = null;
        return roleId;
      }
    }
  ]);
}
