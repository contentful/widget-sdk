'use strict';

angular.module('contentful').directive('cfRoleList', () => ({
  restrict: 'E',
  template: JST['role_list'](),
  controller: 'RoleListController'
}));

angular.module('contentful').controller('RoleListController', [
  '$scope',
  'require',
  ($scope, require) => {
    const $state = require('$state');
    const $q = require('$q');
    const ReloadNotification = require('ReloadNotification');
    const listHandler = require('UserListHandler').create();
    const createRoleRemover = require('createRoleRemover');
    const accessChecker = require('access_control/AccessChecker');
    const jumpToRoleMembers = require('UserListController/jumpToRole');
    const spaceContext = require('spaceContext');
    const ADMIN_ROLE_ID = require('access_control/SpaceMembershipRepository.es6').ADMIN_ROLE_ID;
    const ResourceUtils = require('utils/ResourceUtils.es6');
    const TheAccountView = require('TheAccountView');
    const isOwnerOrAdmin = require('services/OrganizationRoles.es6').isOwnerOrAdmin;
    const AccessChecker = require('access_control/AccessChecker');

    const org = spaceContext.organizationContext.organization;

    $scope.loading = true;
    $q.all({
      canModifyRoles: AccessChecker.canModifyRoles(),
      useLegacy: ResourceUtils.useLegacy(org)
    })
      .then(result => {
        const subscription = spaceContext.subscription;
        const trialLockdown = subscription.isTrial() && subscription.hasTrialEnded();

        $scope.legacy = result.useLegacy;
        $scope.hasFeatureEnabled = !trialLockdown && result.canModifyRoles;
        $scope.loading = false;
      })
      .then(reload)
      .catch(ReloadNotification.basicErrorHandler);

    $scope.isTranslator = isTranslator;
    $scope.duplicateRole = duplicateRole;
    $scope.jumpToRoleMembers = jumpToRoleMembers;
    $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
    $scope.accountUpgradeState = TheAccountView.getSubscriptionState();
    $scope.canUpgrade = isOwnerOrAdmin(org);

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
