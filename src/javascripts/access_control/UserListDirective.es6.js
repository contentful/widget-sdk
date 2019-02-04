import { registerDirective, registerController, registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import template from 'access_control/templates/UserList.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';

export default function register() {
  registerDirective('cfUserList', [
    'UserListController/jumpToRole',
    '$timeout',
    'TheStore',
    (jumpToRole, $timeout, TheStore) => {
      const { popRoleId } = jumpToRole;
      const { getStore } = TheStore;
      const store = getStore().forKey('userListView');

      const VIEW_BY_NAME = 'name';
      const VIEW_BY_ROLE = 'role';
      const VIEW_LABELS = {};
      VIEW_LABELS[VIEW_BY_NAME] = 'Show users in alphabetical order';
      VIEW_LABELS[VIEW_BY_ROLE] = 'Show users grouped by role';

      return {
        restrict: 'E',
        template: template(),
        controller: 'UserListController',
        link
      };

      function saveView(view) {
        if (_.includes([VIEW_BY_NAME, VIEW_BY_ROLE], view)) {
          store.set(view);
        }
      }

      function link(scope, el) {
        const roleId = popRoleId();
        scope.viewLabels = VIEW_LABELS;
        scope.selectedView = roleId ? VIEW_BY_ROLE : store.get() || VIEW_BY_NAME;
        scope.jumpToRole = roleId ? _.once(jumpToRole) : _.noop;
        scope.$watch('selectedView', saveView);

        function jumpToRole() {
          $timeout(() => {
            const groupHeader = el.find('#role-group-' + roleId).first();
            const scrollContainer = el.find('.workbench-main__content').first();

            if (groupHeader.length && scrollContainer.length) {
              const scrollTo = scrollContainer.scrollTop() + groupHeader.position().top;
              scrollContainer.scrollTop(scrollTo);
            }
          });
        }
      }
    }
  ]);

  registerController('UserListController', [
    '$scope',
    'spaceContext',
    'UserListHandler',
    'access_control/AccessChecker',
    'services/TokenStore.es6',
    'access_control/UserListActions.es6',
    ($scope, spaceContext, UserListHandler, accessChecker, TokenStore, UserListActions) => {
      const userListHandler = UserListHandler.create();
      const actions = UserListActions.create(spaceContext, userListHandler, TokenStore);

      $scope.userQuota = { used: 1 };
      $scope.$watch(accessChecker.getUserQuota, q => {
        $scope.userQuota = q;
      });

      $scope.openRemovalConfirmationDialog = decorateWithReload(
        actions.openRemovalConfirmationDialog
      );
      $scope.openRoleChangeDialog = decorateWithReload(actions.openRoleChangeDialog);
      $scope.canModifyUsers = accessChecker.canModifyUsers;
      $scope.openSpaceInvitationDialog = openSpaceInvitationDialog;

      reload();

      function decorateWithReload(command) {
        return function(...args) {
          return command(...args).then(reload);
        };
      }

      function openSpaceInvitationDialog() {
        $scope.isInvitingUsersToSpace = true;

        decorateWithReload(actions.openSpaceInvitationDialog)().finally(() => {
          $scope.isInvitingUsersToSpace = false;
        });
      }

      /**
       * Reset the list with a new data
       */
      function reload() {
        return (
          userListHandler
            .reset()
            .then(onResetResponse, accessChecker.wasForbidden($scope.context))
            // Refresh token in case the changes affected current user.
            // TODO - handle this in the user action
            .finally(TokenStore.refresh())
            .catch(ReloadNotification.basicErrorHandler)
        );
      }

      function onResetResponse() {
        $scope.spaceUsersCount = userListHandler.getUserCount();
        $scope.by = userListHandler.getGroupedUsers();
        $scope.context.ready = true;
        $scope.jumpToRole();
      }
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
        if (spaceContext.getEnvironmentId() === 'master') {
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
