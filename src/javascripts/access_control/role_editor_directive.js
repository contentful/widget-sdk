'use strict';

angular.module('contentful').directive('cfRoleEditor', () => ({
  restrict: 'E',
  template: JST['role_editor'](),
  controller: 'RoleEditorController'
}));

angular.module('contentful').controller('RoleEditorController', [
  '$scope',
  'require',
  ($scope, require) => {
    const $state = require('$state');
    const $q = require('$q');
    const Command = require('command');
    const spaceContext = require('spaceContext');
    const TheLocaleStore = require('TheLocaleStore');
    const space = spaceContext.space;
    const roleRepo = require('RoleRepository').getInstance(space);
    const listHandler = require('UserListHandler').create();
    const createRoleRemover = require('createRoleRemover');
    const PolicyBuilder = require('PolicyBuilder');
    const TheAccountView = require('TheAccountView');
    const leaveConfirmator = require('navigation/confirmLeaveEditor');
    const notification = require('notification');
    const logger = require('logger');
    const createFeatureService = require('services/FeatureService.es6').default;
    const createResourceService = require('services/ResourceService.es6').default;
    const ResourceUtils = require('utils/ResourceUtils.es6');

    const organization = spaceContext.organization;
    const FeatureService = createFeatureService(spaceContext.getId());

    $scope.loading = true;

    $q.all({
      featureEnabled: FeatureService.get('customRoles'),
      resource: createResourceService(spaceContext.getId()).get('role'),
      useLegacy: ResourceUtils.useLegacy(organization)
    }).then(result => {
      const isNew = $scope.context.isNew;

      $scope.legacy = result.useLegacy;

      if (!result.featureEnabled) {
        $scope.hasCustomRolesFeature = false;
        $scope.canModifyRoles = false;
      } else if (isNew && !ResourceUtils.canCreate(result.resource)) {
        notification.error('Your organization has reached the limit for custom roles.');
        $scope.hasCustomRolesFeature = true;
        $scope.canModifyRoles = false;
      } else {
        $scope.hasCustomRolesFeature = true;
        $scope.canModifyRoles = true;
      }

      $scope.loading = false;
    });

    // 1. prepare "touch" counter (first touch for role->internal, next for dirty state)
    $scope.context.touched = $scope.context.isNew ? 0 : -1;

    $scope.accountUpgradeState = TheAccountView.getSubscriptionState();

    // 2. prepare role object based on duplication target
    if ($scope.baseRole) {
      $scope.role = _.extend(
        { name: 'Duplicate of ' + $scope.baseRole.name },
        _.omit($scope.baseRole, ['name', 'sys'])
      );
    }

    // 3. setup leaving confirmation
    $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

    $scope.$watch('context.touched', touched => {
      $scope.context.dirty = touched > 0;
    });

    $scope.$watch(
      'role',
      role => {
        $scope.internal = PolicyBuilder.toInternal(role);
      },
      true
    );

    $scope.$watch('internal', (current, prev) => {
      if (current === prev) {
        autofixPolicies();
      }
    });

    $scope.$watch(
      'internal',
      internal => {
        $scope.external = PolicyBuilder.toExternal(internal);
        $scope.context.touched += 1;
        $scope.context.title = internal.name || 'Untitled';
      },
      true
    );

    $scope.save = Command.create(save, {
      disabled: function() {
        return !$scope.context.dirty;
      }
    });

    $scope.duplicateRole = duplicateRole;
    $scope.resetPolicies = resetPolicies;

    // check if we should show the 'translator' role
    $scope.showTranslator = showTranslator();

    // setup "Remove" button:
    listHandler.reset().then(() => {
      $scope.removeRole = () => {
        createRoleRemover(listHandler, () => {
          $scope.context.touched = 0;
          $scope.context.dirty = false;
          $state.go('^.list');
        })($scope.role);
      };
    });

    function showTranslator() {
      return /^Translator/.test($scope.role.name);
    }

    function duplicateRole() {
      if (_.get($scope, 'role.sys.id')) {
        $state.go('^.new', { baseRoleId: $scope.role.sys.id });
      }
    }

    function resetPolicies() {
      _.extend($scope.internal, {
        entries: { allowed: [], denied: [] },
        assets: { allowed: [], denied: [] },
        uiCompatible: true
      });
    }

    function save() {
      if (!_.get($scope, 'external.policies', null)) {
        notification.error('Policies: invalid JSON.');
        return $q.reject();
      }

      const method = $scope.context.isNew ? 'create' : 'save';
      return roleRepo[method]($scope.external).then(handleRole, handleError);
    }

    function handleRole(role) {
      notification.info(role.name + ' role saved successfully');

      if ($scope.context.isNew) {
        $scope.context.dirty = false;
        return $state.go('^.detail', { roleId: role.sys.id });
      } else {
        $scope.role = role;
        $scope.context.touched = -1;
        $scope.autofixed = false;
        return $q.resolve(role);
      }
    }

    function handleError(res) {
      const errors = _.get(res, 'body.details.errors', []);

      if (_.includes([403, 404], parseInt(_.get(res, 'statusCode'), 10))) {
        notification.error('You have exceeded your plan limits for Custom Roles.');
        return $q.reject();
      }

      if (_.isObject(findError('taken'))) {
        notification.error('This role name is already used.');
        return $q.reject();
      }

      const nameError = findError('length');
      const nameValue = _.isObject(nameError) ? nameError.value : null;

      if (!nameValue) {
        notification.error('You have to provide a role name.');
      } else if (_.isString(nameValue) && nameValue.length > 0) {
        notification.error('The provided role name is too long.');
      } else {
        notification.error('Error saving role. Please try again.');
        logger.logServerWarn('Error saving role', { errors: errors });
      }

      return $q.reject();

      function findError(errName) {
        return _.find(
          errors,
          err => _.isObject(err) && err.name === errName && err.path === 'name'
        );
      }
    }

    function autofixPolicies() {
      const cts = spaceContext.publishedCTs.getAllBare();
      const locales = TheLocaleStore.getPrivateLocales();
      $scope.autofixed = PolicyBuilder.removeOutdatedRules($scope.internal, cts, locales);
      if ($scope.autofixed) {
        $scope.context.touched += 1;
      }
    }
  }
]);
