import _, { sortBy } from 'lodash';

import { registerDirective, registerController, getModule } from 'NgRegistry.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import * as ResourceUtils from 'utils/ResourceUtils.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as RoleListHandler from 'access_control/RoleListHandler.es6';
import createResourceService from 'services/ResourceService.es6';
import { getSubscriptionState } from 'account/AccountUtils.es6';

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
    ($scope, $state, createRoleRemover, jumpToRoleMembers) => {
      const spaceContext = getModule('spaceContext');
      const listHandler = RoleListHandler.create();
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
        jumpToRoleMembers(RoleListHandler.ADMIN_ROLE_NAME);
      }

      function duplicateRole(role) {
        $state.go('^.new', { baseRoleId: role.sys.id });
      }

      function reload() {
        return listHandler
          .reset()
          .then(onResetResponse, accessChecker.wasForbidden($scope.context));
      }

      async function onResetResponse(data) {
        const rolesResource = await createResourceService(spaceContext.getId()).get('role');

        const roleCounts = listHandler.getRoleCounts();
        $scope.countAdmin = roleCounts.admin;
        $scope.memberships = roleCounts;

        $scope.roles = sortBy(data.roles, 'name').map(role => {
          role.count = roleCounts[role.sys.id] || 0;

          return role;
        });
        $scope.hasAnyTranslatorRole = hasAnyTranslatorRole($scope.roles);
        $scope.removeRole = createRoleRemover(listHandler, reload);
        $scope.context.ready = true;
        $scope.usage = rolesResource.usage;
        $scope.limit = ResourceUtils.getResourceLimits(rolesResource).maximum;
        $scope.reachedLimit = !ResourceUtils.canCreate(rolesResource);
      }
    }
  ]);
}
