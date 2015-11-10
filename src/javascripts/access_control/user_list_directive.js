'use strict';

angular.module('contentful').directive('cfUserList', ['$injector', function ($injector) {

  var popRoleId = $injector.get('UserListController/jumpToRole').popRoleId;
  var $timeout  = $injector.get('$timeout');

  return {
    restrict: 'E',
    template: JST['user_list'](),
    controller: 'UserListController',
    link: link
  };

  function link(scope, el) {
    var roleId = popRoleId();
    scope.selectedView = roleId ? 'role' : 'name';
    scope.jumpToRole   = roleId ? _.once(jumpToRole) : _.noop;

    function jumpToRole() {
      $timeout(function () {
        var groupHeader = el.find('#role-group-' + roleId).first();
        var scrollContainer = el.find('.workbench-main__middle-content').first();

        if (groupHeader.length && scrollContainer.length) {
          var scrollTo = scrollContainer.scrollTop() + groupHeader.position().top;
          scrollContainer.scrollTop(scrollTo);
        }
      });
    }
  }
}]);

angular.module('contentful').controller('UserListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification  = $injector.get('ReloadNotification');
  var Command             = $injector.get('command');
  var space               = $injector.get('spaceContext').space;
  var $q                  = $injector.get('$q');
  var $rootScope          = $injector.get('$rootScope');
  var modalDialog         = $injector.get('modalDialog');
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);
  var listHandler         = $injector.get('UserListHandler');
  var stringUtils         = $injector.get('stringUtils');

  $scope.viewLabels = {
    name: 'Show users in alphabetical order',
    role: 'Show users grouped by role'
  };

  $scope.removeFromSpace      = removeFromSpace;
  $scope.openRoleChangeDialog = openRoleChangeDialog;
  $scope.openInvitationDialog = openInvitationDialog;

  reload().catch(ReloadNotification.basicErrorHandler);

  function removeFromSpace(user) {
    if (!listHandler.isLastAdmin(user.id)) {
      return modalDialog.openConfirmDeleteDialog({
        title: 'Remove user from a space',
        message: 'Are you sure?',
        confirmLabel: 'Remove'
      }).promise.then(call);
    }

    return modalDialog.open({
      template: 'admin_removal_confirm_dialog',
      scopeData: {
        user: user,
        input: {}
      }
    }).promise.then(call);

    function call() {
      spaceMembershipRepo.remove(user.membership)
      .then(reload)
      .catch(ReloadNotification.basicErrorHandler);
    }
  }

  function openRoleChangeDialog(user) {
    modalDialog.open({
      template: 'role_change_dialog',
      noNewScope: true,
      scope: prepareRoleChangeDialogScope(user)
    });
  }

  function prepareRoleChangeDialogScope(user) {
    var scope = $rootScope.$new();

    return _.extend(scope, {
      user: user,
      startsWithVowel: stringUtils.startsWithVowel,
      input: {},
      roleOptions: listHandler.getRoleOptions(),
      changeRole: Command.create(function () {
        return changeRole(scope.input.id)
        .then(reload)
        .catch(ReloadNotification.basicErrorHandler)
        .finally(function () { scope.dialog.confirm(); });
      }, {
        disabled: function () { return !scope.input.id; }
      })
    });

    function changeRole(roleId) {
      var method = 'changeRoleTo';
      if (listHandler.isAdminRole(roleId)) {
        method = 'changeRoleToAdmin';
      }

      return spaceMembershipRepo[method](user.membership, roleId);
    }
  }

  function openInvitationDialog() {
    modalDialog.open({
      template: 'invitation_dialog',
      noNewScope: true,
      scope: prepareInvitationDialogScope()
    });
  }

  function prepareInvitationDialogScope() {
    var scope = $rootScope.$new();

    return _.extend(scope, {
      input: {},
      roleOptions: listHandler.getRoleOptions(),
      invite: Command.create(function () {
        return invite(scope.input)
        .then(handleSuccess, handleFailure);
      }, {
        disabled: isDisabled
      })
    });

    function invite(data) {
      var method = 'invite';
      if (listHandler.isAdminRole(data.roleId)) {
        method = 'inviteAdmin';
      }

      return spaceMembershipRepo[method](data.mail, data.roleId);
    }

    function handleSuccess() {
      return reload()
      .catch(ReloadNotification.basicErrorHandler)
      .finally(function () { scope.dialog.confirm(); });
    }

    function handleFailure(res) {
      if (isTaken(res)) {
        scope.taken = scope.input.mail;
      } else {
        ReloadNotification.basicErrorHandler();
        scope.dialog.confirm();
      }
    }

    function isTaken(res) {
      var errors = dotty.get(res, 'body.details.errors', []);
      var errorNames = _.pluck(errors, 'name');
      return errorNames.indexOf('taken') > -1;
    }

    function isDisabled() {
      return !scope.invitationForm.$valid || !scope.input.roleId;
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
      $scope.jumpToRole();
    });
  }
}]);

angular.module('contentful').factory('UserListController/jumpToRole', ['$injector', function ($injector) {

  var $state       = $injector.get('$state');
  var targetRoleId = null;

  jump.popRoleId = popRoleId;
  return jump;

  function jump(roleId) {
    targetRoleId = roleId;
    $state.go('spaces.detail.settings.users.list');
  }

  function popRoleId() {
    var roleId = targetRoleId;
    targetRoleId = null;
    return roleId;
  }
}]);
