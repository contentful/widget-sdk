'use strict';

angular.module('contentful').factory('createRoleRemover', ['$injector', function ($injector) {

  var ReloadNotification  = $injector.get('ReloadNotification');
  var $q                  = $injector.get('$q');
  var $rootScope          = $injector.get('$rootScope');
  var modalDialog         = $injector.get('modalDialog');
  var notification        = $injector.get('notification');
  var Command             = $injector.get('command');
  var spaceContext        = $injector.get('spaceContext');
  var roleRepo            = $injector.get('RoleRepository').getInstance(spaceContext.space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(spaceContext.endpoint);

  return function createRoleRemover(listHandler, doneFn) {

    return function removeRole(role) {
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
        .then(doneFn)
        .then(function () { notification.info('Role successfully deleted.'); })
        .catch(ReloadNotification.basicErrorHandler);
      }
    };

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
        var memberships = _.map(users, 'membership');
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
      var counts = listHandler.getMembershipCounts();
      return counts[role.sys.id];
    }
  };
}]);
