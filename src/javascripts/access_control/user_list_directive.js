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
  var spaceContext = require('spaceContext');
  var userListHandler = require('UserListHandler').create();
  var accessChecker = require('accessChecker');
  var TheAccountView = require('TheAccountView');
  var UserListActions = require('access_control/UserListActions');

  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');

  var actions = UserListActions.create(spaceContext, userListHandler);

  $scope.userQuota = {used: 1};
  $scope.$watch(accessChecker.getUserQuota, function (q) { $scope.userQuota = q; });

  $scope.openRemovalConfirmationDialog = decorateWithReload(actions.openRemovalConfirmationDialog);
  $scope.openRoleChangeDialog = decorateWithReload(actions.openRoleChangeDialog);
  $scope.canModifyUsers = canModifyUsers;

  // Begin feature flag code - feature-bv-04-2017-new-space-invitation-flow

  var usesNewSpaceInvitationFlow$ = LD.getFeatureFlag('feature-bv-04-2017-new-space-invitation-flow', function (user) {
    // Disable feature flag for enterprise customers
    var memberships = user && user.organizationMemberships || [];
    var enterpriseMembership = _.find(memberships, function (membership) {
      var subscriptionPlan = _.get(membership, 'organization.subscription.subscriptionPlan.name');

      // @TODO we need a better way to check for this, e.g. using `subscriptionPlan`.kind
      return subscriptionPlan && subscriptionPlan.startsWith('Enterprise');
    });
    return !enterpriseMembership;
  });

  K.onValueScope($scope, usesNewSpaceInvitationFlow$, function (usesNewSpaceInvitationFlow) {
    $scope.usesNewSpaceInvitationFlow = usesNewSpaceInvitationFlow;
    if (usesNewSpaceInvitationFlow) {
      $scope.openSpaceInvitationDialog = openSpaceInvitationDialog;
    } else {
      $scope.canInviteUsers = canInviteUsers;
      $scope.goToSubscription = TheAccountView.goToSubscription;
      $scope.openInvitationDialog = decorateWithReload(actions.openOldInvitationDialog);
    }
  });

  // End feature flag code - feature-bv-04-2017-new-space-invitation-flow

  reload();

  function decorateWithReload (command) {
    return function () {
      return command.apply(null, arguments).then(reload);
    };
  }

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

  function openSpaceInvitationDialog () {
    $scope.isInvitingUsersToSpace = true;

    decorateWithReload(actions.openSpaceInvitationDialog)().finally(function () {
      $scope.isInvitingUsersToSpace = false;
    });
  }

  // End feature flag code - feature-bv-04-2017-new-space-invitation-flow

  /**
   * Reset the list with a new data
   */
  function reload () {
    return userListHandler.reset()
    .then(onResetResponse, accessChecker.wasForbidden($scope.context))
    .catch(ReloadNotification.basicErrorHandler)
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
