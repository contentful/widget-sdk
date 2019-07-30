import { noop, once } from 'lodash';

import { registerDirective, registerController, registerFactory } from 'NgRegistry.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import { getStore } from 'TheStore/index.es6';

import { VIEW_BY_NAME, VIEW_BY_ROLE, VIEW_LABELS } from './constants.es6';

export default function register() {
  registerDirective('cfUserList', [
    'UserListController/jumpToRole',
    '$timeout',
    (jumpToRole, $timeout) => {
      const { popRoleId } = jumpToRole;
      const store = getStore().forKey('userListView');

      return {
        restrict: 'E',
        template: '<react-component name="access_control/Users/UserList.es6" props="props" />',
        controller: 'UserListController',
        link
      };

      function link(scope, el) {
        const roleId = popRoleId();
        scope.viewLabels = VIEW_LABELS;
        scope.props.selectedView = roleId ? VIEW_BY_ROLE : store.get() || VIEW_BY_NAME;
        scope.props.onChangeSelectedView = newView => {
          scope.props.selectedView = newView;
          scope.$applyAsync();
          store.set(newView);
        };
        scope.jumpToRole = roleId ? once(jumpToRole) : noop;

        // TODO: migrate the jumping
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
    'access_control/Users/UserListActions.es6',
    ($scope, spaceContext, UserListHandler, accessChecker, UserListActions) => {
      const userListHandler = UserListHandler.create();
      const actions = UserListActions.create(spaceContext, userListHandler, TokenStore);

      $scope.userQuota = { used: 1 };
      $scope.$watch(accessChecker.getUserQuota, q => {
        $scope.userQuota = q;
      });

      const organization = spaceContext.organization;
      const orgId = organization.sys.id;

      $scope.props = {
        canModifyUsers: accessChecker.canModifyUsers(),
        openSpaceInvitationDialog,
        orgId,
        isOwnerOrAdmin: isOwnerOrAdmin(organization),
        openRemovalConfirmationDialog: decorateWithReload(actions.openRemovalConfirmationDialog),
        openRoleChangeDialog: decorateWithReload(actions.openRoleChangeDialog)
      };

      getOrgFeature(orgId, 'teams', false).then(value => {
        $scope.props.hasTeamsFeature = value;
      });

      reload();

      function decorateWithReload(command) {
        return function(...args) {
          return command(...args).then(reload);
        };
      }

      function openSpaceInvitationDialog() {
        $scope.props.isInvitingUsersToSpace = true;

        decorateWithReload(actions.openSpaceInvitationDialog)().finally(() => {
          $scope.props.isInvitingUsersToSpace = false;
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
        $scope.props = {
          ...$scope.props,
          spaceUsersCount: userListHandler.getUserCount(),
          userGroupsByView: userListHandler.getGroupedUsers()
        };
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
