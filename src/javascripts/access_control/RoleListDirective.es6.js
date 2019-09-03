import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import * as ResourceUtils from 'utils/ResourceUtils.es6';
import { ADMIN_ROLE_ID } from './constants.es6';
import { getSubscriptionState } from 'account/AccountUtils.es6';

import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as UserListHandler from './UserListHandler.es6';

export default function register() {
  registerDirective('cfRoleList', () => ({
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  }));

  registerController('RoleListController', [
    '$scope',
    '$state',
    'createRoleRemover',
    'UserListController/jumpToRole',
    'spaceContext',
    ($scope, $state, createRoleRemover, jumpToRoleMembers, spaceContext) => {
      const listHandler = UserListHandler.create();
      const organization = spaceContext.organization;

      $scope.legacy = ResourceUtils.isLegacyOrganization(organization);

      $scope.loading = true;
      accessChecker
        .canModifyRoles()
        .then(canModifyRoles => {
          $scope.hasFeatureEnabled = canModifyRoles;
          $scope.loading = false;
        })
        .then(reload)
        .catch(ReloadNotification.basicErrorHandler);

      $scope.isTranslator = isTranslator;
      $scope.duplicateRole = duplicateRole;
      $scope.jumpToRoleMembers = jumpToRoleMembers;
      $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
      $scope.accountUpgradeState = getSubscriptionState();
      $scope.canUpgrade = isOwnerOrAdmin(organization);

      function isTranslator(role) {
        return /^Translator/.test(role.name);
      }

      function hasAnyTranslatorRole(roles) {
        return roles && roles.some(isTranslator);
      }

      function jumpToAdminRoleMembers() {
        jumpToRoleMembers(ADMIN_ROLE_ID);
      }

      function duplicateRole(role) {
        $state.go('^.new', { baseRoleId: role.sys.id });
      }

      function reload() {
        return listHandler
          .reset()
          .then(onResetResponse, accessChecker.wasForbidden($scope.context));
      }

      function onResetResponse(data) {
        $scope.memberships = listHandler.getMembershipCounts();
        $scope.countAdmin = $scope.memberships.admin || 0;

        $scope.roles = _.sortBy(data.roles, 'name').map(role => {
          role.count = $scope.memberships[role.sys.id] || 0;

          return role;
        });
        $scope.hasAnyTranslatorRole = hasAnyTranslatorRole($scope.roles);
        $scope.removeRole = createRoleRemover(listHandler, reload);
        $scope.context.ready = true;
        $scope.usage = data.rolesResource.usage;
        $scope.limit = ResourceUtils.getResourceLimits(data.rolesResource).maximum;
        $scope.reachedLimit = !ResourceUtils.canCreate(data.rolesResource);
      }
    }
  ]);
}
