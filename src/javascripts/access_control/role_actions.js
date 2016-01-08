'use strict';

angular.module('contentful').factory('RoleActions', ['$injector', function ($injector) {

  var ReloadNotification = $injector.get('ReloadNotification');
  var $state             = $injector.get('$state');
  var $q                 = $injector.get('$q');
  var $rootScope         = $injector.get('$rootScope');
  var modalDialog        = $injector.get('modalDialog');
  var listHandler        = $injector.get('UserListHandler');
  var jumpToRoleMembers  = $injector.get('UserListController/jumpToRole');
  var notification       = $injector.get('notification');
  var Command            = $injector.get('command');

  var roleRepo            = null;
  var spaceMembershipRepo = null;
  var membershipCounts    = {};
  var reload              = _.noop;

  return {
    reset: reset,
    removeRole: removeRole,
    duplicateRole: duplicateRole,
    jumpToRoleMembers: jumpToRoleMembers,
    jumpToAdminRoleMembers: jumpToAdminRoleMembers
  };

  function reset(config) {
    roleRepo = config.roleRepo;
    spaceMembershipRepo = config.spaceMembershipRepo;
    membershipCounts = config.membershipCounts;
    reload = config.reload;
    listHandler.reset(config.data);
  }

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

  function getCountFor(role) {
    return membershipCounts[role.sys.id];
  }

  function duplicateRole(role) {
    $state.go('spaces.detail.settings.roles.new', {baseRoleId: role.sys.id});
  }

  function jumpToAdminRoleMembers() {
    jumpToRoleMembers(listHandler.getAdminRoleId());
  }
}]);
