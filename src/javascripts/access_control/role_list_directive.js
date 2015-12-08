'use strict';

angular.module('contentful').directive('cfRoleList', function () {
  return {
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  };
});

angular.module('contentful').controller('RoleListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification  = $injector.get('ReloadNotification');
  var space               = $injector.get('spaceContext').space;
  var $state              = $injector.get('$state');
  var $q                  = $injector.get('$q');
  var $rootScope          = $injector.get('$rootScope');
  var modalDialog         = $injector.get('modalDialog');
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);
  var listHandler         = $injector.get('UserListHandler');
  var jumpToRoleMembers   = $injector.get('UserListController/jumpToRole');
  var notification        = $injector.get('notification');
  var Command             = $injector.get('command');
  var accessChecker       = $injector.get('accessChecker');

  $scope.removeRole             = removeRole;
  $scope.duplicateRole          = duplicateRole;
  $scope.jumpToRoleMembers      = jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
  $scope.canModifyRoles         = accessChecker.canModifyRoles;

  reload().catch(ReloadNotification.basicErrorHandler);

  function removeRole(role) {
    if (getCountFor(role)) {
      modalDialog.open({
        template: 'role_removal_dialog',
        noNewScope: true,
        ignoreEsc: true,
        backgroundClose: false,
        scope: prepareRemovalDialogScope(role, remove)
      });
    } else {
      remove();
    }

    function remove() {
      return roleRepo.remove(role)
      .then(reload)
      .then(function () { notification.info('Role successfully deleted.'); })
      .catch(ReloadNotification.basicErrorHandler);
    }
  }

  function prepareRemovalDialogScope(role, remove) {
    var scope = $rootScope.$new();

    return _.extend(scope, {
      role: role,
      input: {},
      count: getCountFor(role),
      roleOptions: listHandler.getRoleOptionsBut(role.sys.id),
      moveUsersAndRemoveRole: Command.create(moveUsersAndRemoveRole, {
        disabled: function () { return !scope.input.id; }
      })
    });

    function moveUsersAndRemoveRole() {
      var users = listHandler.getUsersByRole(role.sys.id);
      var memberships = _.pluck(users, 'membership');
      var moveToRoleId = scope.input.id;
      var method = 'changeRoleTo';

      if (listHandler.isAdminRole(moveToRoleId)) {
        method = 'changeRoleToAdmin';
      }

      var promises = _.map(memberships, function (membership) {
        return spaceMembershipRepo[method](membership, moveToRoleId);
      });

      return $q.all(promises).then(function () {
        return remove()
        .finally(function () { scope.dialog.confirm(); });
      }, ReloadNotification.basicErrorHandler);
    }
  }

  function duplicateRole(role) {
    $state.go('spaces.detail.settings.roles.new', {baseRoleId: role.sys.id});
  }

  function reload() {
    return $q.all({
      memberships: spaceMembershipRepo.getAll(),
      roles: roleRepo.getAll(),
      users: space.getUsers()
    }).then(function (data) {
      $scope.memberships = countMemberships(data.memberships);
      $scope.roles = _.sortBy(data.roles, 'name');
      listHandler.reset(data);
      $scope.context.ready = true;
    });
  }

  function countMemberships(memberships) {
    var counts = { admin: 0 };

    _.forEach(memberships, function (item) {
      if (item.admin) { counts.admin += 1; }
      _.forEach(item.roles || [], function (role) {
        counts[role.sys.id] = counts[role.sys.id] || 0;
        counts[role.sys.id] += 1;
      });
    });

    return counts;
  }

  function getCountFor(role) {
    return $scope.memberships[role.sys.id];
  }

  function jumpToAdminRoleMembers() {
    jumpToRoleMembers(listHandler.getAdminRoleId());
  }
}]);
