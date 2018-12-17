import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';

registerDirective('cfRoleList', () => ({
  restrict: 'E',
  template: JST['role_list'](),
  controller: 'RoleListController'
}));

registerController('RoleListController', [
  '$scope',
  '$state',
  '$q',
  'UserListHandler',
  'createRoleRemover',
  'access_control/AccessChecker',
  'UserListController/jumpToRole',
  'spaceContext',
  'TheAccountView',
  'access_control/SpaceMembershipRepository.es6',
  'utils/ResourceUtils.es6',
  (
    $scope,
    $state,
    $q,
    UserListHandler,
    createRoleRemover,
    accessChecker,
    jumpToRoleMembers,
    spaceContext,
    TheAccountView,
    SpaceMembershipRepository,
    ResourceUtils
  ) => {
    const listHandler = UserListHandler.create();
    const { ADMIN_ROLE_ID } = SpaceMembershipRepository;
    const organization = spaceContext.organization;

    $scope.loading = true;
    $q.all({
      canModifyRoles: accessChecker.canModifyRoles(),
      useLegacy: ResourceUtils.useLegacy(organization)
    })
      .then(result => {
        $scope.legacy = result.useLegacy;
        $scope.hasFeatureEnabled = result.canModifyRoles;
        $scope.loading = false;
      })
      .then(reload)
      .catch(ReloadNotification.basicErrorHandler);

    $scope.isTranslator = isTranslator;
    $scope.duplicateRole = duplicateRole;
    $scope.jumpToRoleMembers = jumpToRoleMembers;
    $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
    $scope.accountUpgradeState = TheAccountView.getSubscriptionState();
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
      return listHandler.reset().then(onResetResponse, accessChecker.wasForbidden($scope.context));
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
