import { includes, noop, once } from 'lodash';

import { registerDirective, registerController, registerFactory } from 'NgRegistry.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import { getStore } from 'TheStore/index.es6';

import template from './templates/UserList.es6';

export default function register() {
  registerDirective('cfUserList', [
    'UserListController/jumpToRole',
    '$timeout',
    (jumpToRole, $timeout) => {
      const { popRoleId } = jumpToRole;
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

      function saveView(view, _, scope) {
        if (includes([VIEW_BY_NAME, VIEW_BY_ROLE], view)) {
          scope.userListProps.selectedView = scope.selectedView;
          store.set(view);
        }
      }

      function link(scope, el) {
        const roleId = popRoleId();
        scope.viewLabels = VIEW_LABELS;
        scope.selectedView = roleId ? VIEW_BY_ROLE : store.get() || VIEW_BY_NAME;
        scope.userListProps.selectedView = scope.selectedView;
        scope.jumpToRole = roleId ? once(jumpToRole) : noop;
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
    'access_control/UserListActions.es6',
    ($scope, spaceContext, UserListHandler, accessChecker, UserListActions) => {
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

      $scope.userListProps = {
        canModifyUsers: $scope.canModifyUsers(),
        openRoleChangeDialog: $scope.openRoleChangeDialog,
        openRemovalConfirmationDialog: $scope.openRemovalConfirmationDialog
      };

      const organization = spaceContext.organization;
      const orgId = organization.sys.id;

      $scope.addUsersToSpaceNoteProps = {
        orgId,
        isOwnerOrAdmin: isOwnerOrAdmin(organization)
      };

      getOrgFeature(orgId, 'teams', false).then(value => {
        $scope.addUsersToSpaceNoteProps.hasTeamsFeature = value;
      });

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
        $scope.hasTeamSpaceMemberships = userListHandler.hasTeamSpaceMemberships();
        $scope.spaceUsersCount = userListHandler.getUserCount();
        $scope.userListProps.by = userListHandler.getGroupedUsers();
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
