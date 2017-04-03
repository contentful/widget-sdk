'use strict';

angular.module('contentful').directive('cfUserList', ['$injector', function ($injector) {

  var popRoleId = $injector.get('UserListController/jumpToRole').popRoleId;
  var $timeout = $injector.get('$timeout');
  var store = $injector.get('TheStore').forKey('userListView');

  var VIEW_BY_NAME = 'name';
  var VIEW_BY_ROLE = 'role';
  var VIEW_LABELS = {};
  VIEW_LABELS[VIEW_BY_NAME] = 'Show users in alphabetical order';
  VIEW_LABELS[VIEW_BY_ROLE] = 'Show users grouped by role';

  return {
    restrict: 'E',
    template: JST['user_list'](),
    controller: 'UserListController',
    link: link
  };

  function saveView (view) {
    if (_.includes([VIEW_BY_NAME, VIEW_BY_ROLE], view)) {
      store.set(view);
    }
  }

  function link (scope, el) {
    var roleId = popRoleId();
    scope.viewLabels = VIEW_LABELS;
    scope.selectedView = roleId ? VIEW_BY_ROLE : (store.get() || VIEW_BY_NAME);
    scope.jumpToRole = roleId ? _.once(jumpToRole) : _.noop;
    scope.$watch('selectedView', saveView);

    function jumpToRole () {
      $timeout(function () {
        var groupHeader = el.find('#role-group-' + roleId).first();
        var scrollContainer = el.find('.workbench-main__content').first();

        if (groupHeader.length && scrollContainer.length) {
          var scrollTo = scrollContainer.scrollTop() + groupHeader.position().top;
          scrollContainer.scrollTop(scrollTo);
        }
      });
    }
  }
}]);

angular.module('contentful').controller('UserListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification = $injector.get('ReloadNotification');
  var Command = $injector.get('command');
  var $rootScope = $injector.get('$rootScope');
  var modalDialog = $injector.get('modalDialog');
  var spaceContext = $injector.get('spaceContext');
  var listHandler = $injector.get('UserListHandler').create();
  var stringUtils = $injector.get('stringUtils');
  var notification = $injector.get('notification');
  var accessChecker = $injector.get('accessChecker');
  var TheAccountView = $injector.get('TheAccountView');

  var MODAL_OPTS_BASE = {
    noNewScope: true,
    ignoreEsc: true,
    backgroundClose: false
  };

  $scope.userQuota = {used: 1};
  $scope.$watch(accessChecker.getUserQuota, function (q) { $scope.userQuota = q; });

  $scope.openRemovalConfirmationDialog = openRemovalConfirmationDialog;
  $scope.openRoleChangeDialog = openRoleChangeDialog;
  $scope.openInvitationDialog = openInvitationDialog;
  $scope.canModifyUsers = canModifyUsers;
  $scope.canInviteUsers = canInviteUsers;
  $scope.goToSubscription = TheAccountView.goToSubscription.bind(TheAccountView);

  reload().catch(ReloadNotification.basicErrorHandler);

  function canModifyUsers () {
    var subscription = spaceContext.subscription;
    var trialLockdown = subscription &&
      subscription.isTrial() && subscription.hasTrialEnded();
    return accessChecker.canModifyUsers() && !trialLockdown;
  }

  function canInviteUsers () {
    var q = $scope.userQuota;
    var withinQuota = !(q.used >= q.limit && q.limit > 0);

    return withinQuota && canModifyUsers();
  }

  /**
   * Remove an user from a space
   */
  function openRemovalConfirmationDialog (user) {
    if (listHandler.isLastAdmin(user.id)) {
      return modalDialog.open(_.extend({
        template: 'admin_removal_confirm_dialog',
        scope: prepareRemovalConfirmationDialogScope(user)
      }, MODAL_OPTS_BASE));
    }

    return modalDialog.open(_.extend({
      template: 'user_removal_confirm_dialog',
      scope: prepareRemovalConfirmationDialogScope(user)
    }, MODAL_OPTS_BASE));
  }

  function prepareRemovalConfirmationDialogScope (user) {
    var scope = $rootScope.$new();

    return _.extend(scope, {
      user: user,
      input: {},
      removeUser: Command.create(function () {
        return spaceContext.memberships.remove(user.membership)
        .then(reload)
        .then(function () {
          notification.info('User successfully removed from this space.');
          $scope.userQuota.used -= 1;
        })
        .catch(ReloadNotification.basicErrorHandler)
        .finally(function () { scope.dialog.confirm(); });
      }, {
        disabled: isDisabled
      })
    });

    function isDisabled () {
      return listHandler.isLastAdmin(user.id) && scope.input.confirm !== 'I UNDERSTAND';
    }
  }

  /**
   * Change a role of an user
   */
  function openRoleChangeDialog (user) {
    modalDialog.open(_.extend({
      template: 'role_change_dialog',
      scope: prepareRoleChangeDialogScope(user)
    }, MODAL_OPTS_BASE));
  }

  function prepareRoleChangeDialogScope (user) {
    var scope = $rootScope.$new();

    return _.extend(scope, {
      user: user,
      startsWithVowel: stringUtils.startsWithVowel,
      input: {},
      roleOptions: listHandler.getRoleOptions(),
      changeRole: Command.create(function () {
        return changeRole(scope.input.id)
        .then(reload)
        .then(function () { notification.info('User role successfully changed.'); })
        .catch(ReloadNotification.basicErrorHandler)
        .finally(function () { scope.dialog.confirm(); });
      }, {
        disabled: function () { return !scope.input.id; }
      })
    });

    function changeRole (roleId) {
      var method = 'changeRoleTo';
      if (listHandler.isAdminRole(roleId)) {
        method = 'changeRoleToAdmin';
      }

      return spaceContext.memberships[method](user.membership, roleId);
    }
  }

  /**
   * Send an invitation
   */
  function openInvitationDialog () {
    modalDialog.open(_.extend({
      template: 'invitation_dialog',
      scope: prepareInvitationDialogScope()
    }, MODAL_OPTS_BASE));
  }

  function prepareInvitationDialogScope () {
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

    function invite (data) {
      var method = 'invite';
      if (listHandler.isAdminRole(data.roleId)) {
        method = 'inviteAdmin';
      }

      return spaceContext.memberships[method](data.mail, data.roleId);
    }

    function handleSuccess () {
      return reload()
      .then(function () {
        notification.info('Invitation successfully sent.');
        $scope.userQuota.used += 1;
      })
      .catch(ReloadNotification.basicErrorHandler)
      .finally(function () { scope.dialog.confirm(); });
    }

    function handleFailure (res) {
      if (isTaken(res)) {
        scope.taken = scope.input.mail;
        scope.backendMessage = null;
      } else if (isForbidden(res)) {
        scope.taken = null;
        scope.backendMessage = res.data.message;
      } else {
        ReloadNotification.basicErrorHandler();
        scope.dialog.confirm();
      }
    }

    function isTaken (res) {
      var errors = dotty.get(res, 'data.details.errors', []);
      var errorNames = _.map(errors, 'name');
      return errorNames.indexOf('taken') > -1;
    }

    function isForbidden (res) {
      return (
        dotty.get(res, 'data.sys.id') === 'Forbidden' &&
        _.isString(dotty.get(res, 'data.message'))
      );
    }

    function isDisabled () {
      return !scope.invitationForm.$valid || !scope.input.roleId;
    }
  }

  /**
   * Reset the list with a new data
   */
  function reload () {
    return listHandler.reset()
    .then(onResetResponse, accessChecker.wasForbidden($scope.context))
    .finally(accessChecker.reset);
  }

  function onResetResponse () {
    $scope.count = listHandler.getUserCount();
    $scope.by = listHandler.getGroupedUsers();
    $scope.context.ready = true;
    $scope.jumpToRole();
  }
}]);

angular.module('contentful').factory('UserListController/jumpToRole', ['$injector', function ($injector) {

  var $state = $injector.get('$state');
  var targetRoleId = null;

  jump.popRoleId = popRoleId;
  return jump;

  function jump (roleId) {
    targetRoleId = roleId;
    $state.go('spaces.detail.settings.users.list');
  }

  function popRoleId () {
    var roleId = targetRoleId;
    targetRoleId = null;
    return roleId;
  }
}]);
