'use strict';

angular.module('contentful').directive('cfUserList', ['require', function (require) {

  var popRoleId = require('UserListController/jumpToRole').popRoleId;
  var $timeout = require('$timeout');
  var store = require('TheStore').forKey('userListView');

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

angular.module('contentful').controller('UserListController', ['$scope', 'require', function ($scope, require) {
  var ReloadNotification = require('ReloadNotification');
  var Command = require('command');
  var $rootScope = require('$rootScope');
  var modalDialog = require('modalDialog');
  var spaceContext = require('spaceContext');
  var userListHandler = require('UserListHandler').create();
  var stringUtils = require('stringUtils');
  var notification = require('notification');
  var accessChecker = require('accessChecker');
  var TheAccountView = require('TheAccountView');
  var ListQuery = require('ListQuery');
  var entitySelector = require('entitySelector');
  var OrganizationList = require('OrganizationList');
  var $q = require('$q');

  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');

  var organization = spaceContext.organizationContext.organization;

  var MODAL_OPTS_BASE = {
    noNewScope: true,
    ignoreEsc: true,
    backgroundClose: false
  };

  $scope.userQuota = {used: 1};
  $scope.$watch(accessChecker.getUserQuota, function (q) { $scope.userQuota = q; });

  $scope.openRemovalConfirmationDialog = openRemovalConfirmationDialog;
  $scope.openRoleChangeDialog = openRoleChangeDialog;
  $scope.canModifyUsers = canModifyUsers;

  // Begin feature flag code - feature-bv-04-2017-new-space-invitation-flow

  var usesNewSpaceInvitationFlow$ = LD.getFeatureFlag('feature-bv-04-2017-new-space-invitation-flow');
  K.onValueScope($scope, usesNewSpaceInvitationFlow$, function (usesNewSpaceInvitationFlow) {
    $scope.usesNewSpaceInvitationFlow = usesNewSpaceInvitationFlow;
    if (usesNewSpaceInvitationFlow) {
      $scope.goToSubscription = TheAccountView.goToSubscription;
      $scope.goToOrganizationUsers = TheAccountView.goToUsers;
      $scope.canInviteUsersToOrganization = canInviteUsersToOrganization;
      $scope.hasUsersLeftToAdd = hasUsersLeftToAdd;
      $scope.openSpaceInvitationDialog = openSpaceInvitationDialog;
    } else {
      $scope.canInviteUsers = canInviteUsers;
      $scope.openInvitationDialog = openInvitationDialog;
    }
  });

  // End feature flag code - feature-bv-04-2017-new-space-invitation-flow

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

  // Begin feature flag code - feature-bv-04-2017-new-space-invitation-flow

  function canInviteUsersToOrganization () {
    return OrganizationList.isOwnerOrAdmin(organization);
  }

  function getSpaceUserCount () {
    return userListHandler.getUserCount();
  }

  function hasUsersLeftToAdd () {
    var organizationUserCount = organization.usage.permanent.organizationMembership;
    return organizationUserCount > getSpaceUserCount();
  }

  // End feature flag code - feature-bv-04-2017-new-space-invitation-flow

  /**
   * Remove an user from a space
   */
  function openRemovalConfirmationDialog (user) {
    if (userListHandler.isLastAdmin(user.id)) {
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
      return userListHandler.isLastAdmin(user.id) && scope.input.confirm !== 'I UNDERSTAND';
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
      roleOptions: userListHandler.getRoleOptions(),
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
      return spaceContext.memberships.changeRoleTo(user.membership, roleId);
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

    function prepareInvitationDialogScope () {
      var scope = $rootScope.$new();

      return _.extend(scope, {
        input: {},
        roleOptions: userListHandler.getRoleOptions(),
        invite: Command.create(function () {
          return invite(scope.input)
          .then(handleSuccess, handleFailure);
        }, {
          disabled: isDisabled
        })
      });

      function invite (data) {
        return spaceContext.memberships.invite(data.mail, data.roleId);
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
  }

  // Begin feature flag code - feature-bv-04-2017-new-space-invitation-flow

  function openSpaceInvitationDialog () {
    var labels = {
      title: 'Add users to space',
      input: 'Select users',
      selected: 'selected users',
      insert: 'Assign roles to selected users',
      infoHtml: JST.users_add_note() // @TODO use hyperscript
    };
    $scope.isInvitingUsersToSpace = true;

    return entitySelector.open({
      entityType: 'User',
      fetch: fetchUsers,
      multiple: true,
      min: 1,
      max: Infinity,
      labels: labels,
      scope: {
        goToOrganizationUsers: $scope.goToOrganizationUsers,
        canInviteUsersToOrganization: $scope.canInviteUsersToOrganization
      }
    })
    .then(function (result) {
      var scopeData = {
        users: result,
        roleOptions: userListHandler.getRoleOptions(),
        selectedRoles: {}
      };

      return modalDialog.open({
        template: require('access_control/templates/UserSpaceInvitationDialog').default(),
        backgroundClose: false,
        ignoreEsc: true,
        noNewScope: true,
        scopeData: scopeData
      }).promise;
    })
    .then(handleSuccess, handleCancel);

    function fetchUsers (params) {
      return ListQuery.getForUsers(params).then(function (query) {
        return spaceContext.organizationContext.getAllUsers(query);
      }).then(function (organizationUsers) {
        var spaceUserIds = userListHandler.getUserIds();
        var displayedUsers = organizationUsers.filter(function (item) {
          var id = _.get(item, 'sys.id');
          return id && !_.includes(spaceUserIds, id);
        });
        return { items: displayedUsers, total: organizationUsers.length };
      });
    }

    function handleSuccess () {
      $scope.isInvitingUsersToSpace = false;
      return reload().then(function () {
        notification.info('Invitations successfully sent.');
      })
      .catch(ReloadNotification.basicErrorHandler);
    }

    function handleCancel () {
      $scope.isInvitingUsersToSpace = false;
    }
  }

  // End feature flag code - feature-bv-04-2017-new-space-invitation-flow

  /**
   * Reset the list with a new data
   */
  function reload () {
    return userListHandler.reset()
    .then(onResetResponse, accessChecker.wasForbidden($scope.context))
    .finally(accessChecker.reset);
  }

  function onResetResponse () {
    $scope.spaceUsersCount = userListHandler.getUserCount();
    $scope.by = userListHandler.getGroupedUsers();
    $scope.context.ready = true;
    $scope.jumpToRole();
  }

}]);

angular.module('contentful').factory('UserListController/jumpToRole', ['require', function (require) {

  var $state = require('$state');
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
