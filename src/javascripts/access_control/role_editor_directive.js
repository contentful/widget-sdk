'use strict';

angular.module('contentful').directive('cfRoleEditor', function () {
  return {
    restrict: 'E',
    template: JST['role_editor'](),
    controller: 'RoleEditorController'
  };
});

angular.module('contentful').controller('RoleEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var $state           = $injector.get('$state');
  var $q               = $injector.get('$q');
  var Command          = $injector.get('command');
  var space            = $injector.get('spaceContext').space;
  var roleRepo         = $injector.get('RoleRepository').getInstance(space);
  var PolicyBuilder    = $injector.get('PolicyBuilder');
  var leaveConfirmator = $injector.get('navigation/confirmLeaveEditor');
  var notification     = $injector.get('notification');
  var analytics        = $injector.get('analytics');
  var logger           = $injector.get('logger');
  var accessChecker    = $injector.get('accessChecker');
  var TrialWatcher     = $injector.get('TrialWatcher');

  // 1. prepare "touch" counter (first touch for role->internal, next for dirty state)
  $scope.context.touched = $scope.context.isNew ? 0 : -1;

  // 2. prepare role object based on duplication target
  if ($scope.baseRole) {
    $scope.role = _.extend(
      { name: 'Duplicate of ' + $scope.baseRole.name },
      _.omit($scope.baseRole, ['name', 'sys'])
    );
  }

  // 3. setup leaving confirmation
  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

  $scope.$watch('context.touched', function (touched) {
    $scope.context.dirty = touched > 0;
  });

  $scope.$watch('role', function (role) {
    $scope.internal = PolicyBuilder.toInternal(role);
  }, true);

  $scope.$watch('internal', function (internal) {
    $scope.external = PolicyBuilder.toExternal(internal);
    $scope.context.touched += 1;
    $scope.context.title = internal.name || 'Untitled';
  }, true);

  $scope.save = Command.create(save, {
    disabled: function () { return !$scope.context.dirty; }
  });

  $scope.duplicateRole  = duplicateRole;
  $scope.removeRole     = removeRole;
  $scope.canModifyRoles = canModifyRoles;
  $scope.resetPolicies  = resetPolicies;

  function duplicateRole() {
    if (dotty.get($scope, 'role.sys.id')) {
      $state.go('spaces.detail.settings.roles.new', {baseRoleId: $scope.role.sys.id});
    }
  }

  function removeRole() {
    window.alert('Not implemented.');
  }

  function canModifyRoles() {
    return accessChecker.canModifyRoles() && !TrialWatcher.hasEnded();
  }

  function resetPolicies() {
    _.extend($scope.internal, {
      entries: {allowed: [], denied: []},
      assets: {allowed: [], denied: []},
      uiCompatible: true
    });
  }

  function save() {
    if (!dotty.get($scope, 'external.policies', null)) {
      notification.error('Policies: invalid JSON.');
      return $q.reject();
    }

    var method = $scope.context.isNew ? 'create' : 'save';
    return roleRepo[method]($scope.external).then(handleRole, handleError);
  }

  function handleRole(role) {
    notification.info($scope.context.title + ' role saved successfully');
    trackRoleChange(role);

    if ($scope.context.isNew) {
      $scope.context.dirty = false;
      return $state.go('spaces.detail.settings.roles.detail', { roleId: role.sys.id });
    } else {
      $scope.role = role;
      $scope.context.touched = -1;
      return $q.when(role);
    }
  }

  function handleError(res) {
    var errors = dotty.get(res, 'body.details.errors', []);

    if (_.contains([403, 404], parseInt(dotty.get(res, 'statusCode'), 10))) {
      notification.error('Your plan does not include Custom Roles.');
      return $q.reject();
    }

    if (_.isObject(findError('taken'))) {
      notification.error('This role name is already used.');
      return $q.reject();
    }

    var nameError = findError('length');
    var nameValue = _.isObject(nameError) ? nameError.value : null;

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
      return _.find(errors, function (err) {
        return _.isObject(err) && err.name === errName && err.path === 'name';
      });
    }
  }

  function trackRoleChange(changedRole) {
    var eventName = 'Role created in UI';
    var data = { changedRole: changedRole };

    if (!$scope.context.isNew) {
      eventName = 'Role changed in UI';
      data.originalRole = $scope.role;
    }

    analytics.track(eventName, data);
  }
}]);
