import { registerFactory } from 'NgRegistry.es6';

export default function register() {
  registerFactory('UserListController/jumpToRole', [
    '$state',
    'spaceContext',
    ($state, spaceContext) => {
      let jumpToRole = null;

      jump.popRoleId = popRoleId;
      return jump;

      function jump(roleName) {
        jumpToRole = roleName;
        if (spaceContext.isMasterEnvironment()) {
          $state.go('spaces.detail.settings.users.list', { jumpToRole });
        } else {
          $state.go('spaces.detail.environment.settings.users.list', { jumpToRole });
        }
      }

      function popRoleId() {
        const roleId = jumpToRole;
        jumpToRole = null;
        return roleId;
      }
    }
  ]);
}
