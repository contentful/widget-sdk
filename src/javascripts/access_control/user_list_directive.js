'use strict';

angular.module('contentful').directive('cfUserList', function () {
  return {
    restrict: 'E',
    template: JST['user_list'](),
    controller: 'UserListController'
  };
});

angular.module('contentful').controller('UserListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification  = $injector.get('ReloadNotification');
  var space               = $injector.get('spaceContext').space;
  var $q                  = $injector.get('$q');
  var modalDialog         = $injector.get('modalDialog');
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);
  var listHandler         = $injector.get('UserListHandler');

  var VOWELS = ['a', 'e', 'i', 'o', 'u'];
  var VIEW_LABELS = {
    name: 'Show users in alphabetical order',
    role: 'Show users grouped by role'
  };

  $scope.viewLabels       = VIEW_LABELS;
  $scope.selectedView     = 'name';
  $scope.removeFromSpace  = removeFromSpace;
  $scope.changeRole       = changeRole;
  $scope.invite           = invite;

  reload().catch(ReloadNotification.basicErrorHandler);

  function removeFromSpace(user) {
    if (!listHandler.isLastAdmin(user.id)) {
      return modalDialog.openConfirmDeleteDialog({
        title: 'Remove user from a space',
        message: 'Are you sure?',
        confirmLabel: 'Remove'
      }).promise.then(remove);
    }

    return modalDialog.open({
      template: 'admin_removal_confirm_dialog',
      scopeData: {
        user: user,
        input: {}
      }
    }).promise.then(remove);

    function remove() {
      spaceMembershipRepo.remove(user.membership)
      .then(reload)
      .catch(ReloadNotification.basicErrorHandler);
    }
  }

  function changeRole(user) {
    modalDialog.open({
      template: 'role_change_dialog',
      scopeData: {
        user: user,
        startsWithVowel: VOWELS.indexOf(dotty.get(user, 'roleNames', ' ').substr(0, 1).toLowerCase()) > -1,
        input: {},
        roleOptions: listHandler.getRoleOptions()
      }
    }).promise.then(change);

    function change(roleId) {
      var method = 'changeRoleTo';
      if (listHandler.isAdminRole(roleId)) {
        method = 'changeRoleToAdmin';
      }

      return spaceMembershipRepo[method](user.membership, roleId)
      .then(reload)
      .catch(ReloadNotification.basicErrorHandler);
    }
  }

  function reload() {
    return $q.all({
      memberships: spaceMembershipRepo.getAll(),
      roles: roleRepo.getAll(),
      users: space.getUsers()
    }).then(function (data) {
      $scope.count = listHandler.reset(data);
      $scope.by = listHandler.getGroupedUsers();
      $scope.context.ready = true;
    });
  }

  function invite() {
    modalDialog.open({
      template: 'invitation_dialog',
      scopeData: {
        input: {},
        roleOptions: listHandler.getRoleOptions()
      }
    }).promise.then(function (invitation) {
      window.alert('To implement: inviting ' + invitation.mail + ' with role ' + invitation.roleId);
    });
  }
}]);
