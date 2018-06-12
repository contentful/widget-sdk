'use strict';

angular.module('contentful').factory('createRoleRemover', ['require', require => {
  var ReloadNotification = require('ReloadNotification');
  var $q = require('$q');
  var $rootScope = require('$rootScope');
  var modalDialog = require('modalDialog');
  var notification = require('notification');
  var Command = require('command');
  var spaceContext = require('spaceContext');
  var roleRepo = require('RoleRepository').getInstance(spaceContext.space);

  return function createRoleRemover (listHandler, doneFn) {
    return function removeRole (role) {
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

      function remove () {
        return roleRepo.remove(role)
        .then(doneFn)
        .then(() => { notification.info('Role successfully deleted.'); })
        .catch(ReloadNotification.basicErrorHandler);
      }
    };

    function prepareRemovalDialogScope (role, remove) {
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

      function moveUsersAndRemoveRole () {
        var users = listHandler.getUsersByRole(role.sys.id);
        var memberships = _.map(users, 'membership');
        var moveToRoleId = scope.input.id;

        var promises = _.map(memberships, membership => spaceContext.memberships.changeRoleTo(membership, [moveToRoleId]));

        return $q.all(promises).then(() => remove()
        .finally(() => { scope.dialog.confirm(); }), ReloadNotification.basicErrorHandler);
      }
    }

    function getCountFor (role) {
      var counts = listHandler.getMembershipCounts();
      return counts[role.sys.id];
    }
  };
}]);
