'use strict';

angular.module('contentful').directive('cfUserList', ['require', require => {
  const popRoleId = require('UserListController/jumpToRole').popRoleId;
  const $timeout = require('$timeout');
  const getStore = require('TheStore').getStore;
  const store = getStore().forKey('userListView');
  const renderString = require('ui/Framework').renderString;

  const VIEW_BY_NAME = 'name';
  const VIEW_BY_ROLE = 'role';
  const VIEW_LABELS = {};
  VIEW_LABELS[VIEW_BY_NAME] = 'Show users in alphabetical order';
  VIEW_LABELS[VIEW_BY_ROLE] = 'Show users grouped by role';

  return {
    restrict: 'E',
    template: renderString(require('access_control/templates/UserList').default()),
    controller: 'UserListController',
    link: link
  };

  function saveView (view) {
    if (_.includes([VIEW_BY_NAME, VIEW_BY_ROLE], view)) {
      store.set(view);
    }
  }

  function link (scope, el) {
    const roleId = popRoleId();
    scope.viewLabels = VIEW_LABELS;
    scope.selectedView = roleId ? VIEW_BY_ROLE : (store.get() || VIEW_BY_NAME);
    scope.jumpToRole = roleId ? _.once(jumpToRole) : _.noop;
    scope.$watch('selectedView', saveView);

    function jumpToRole () {
      $timeout(() => {
        const groupHeader = el.find('#role-group-' + roleId).first();
        const scrollContainer = el.find('.workbench-main__content').first();

        if (groupHeader.length && scrollContainer.length) {
          const scrollTo = scrollContainer.scrollTop() + groupHeader.position().top;
          scrollContainer.scrollTop(scrollTo);
        }
      });
    }
  }
}]);

angular.module('contentful').controller('UserListController', ['$scope', 'require', ($scope, require) => {
  const ReloadNotification = require('ReloadNotification');
  const spaceContext = require('spaceContext');
  const userListHandler = require('UserListHandler').create();
  const accessChecker = require('access_control/AccessChecker');
  const TokenStore = require('services/TokenStore');
  const UserListActions = require('access_control/UserListActions');

  const actions = UserListActions.create(spaceContext, userListHandler, TokenStore);

  $scope.userQuota = {used: 1};
  $scope.$watch(accessChecker.getUserQuota, q => { $scope.userQuota = q; });

  $scope.openRemovalConfirmationDialog = decorateWithReload(actions.openRemovalConfirmationDialog);
  $scope.openRoleChangeDialog = decorateWithReload(actions.openRoleChangeDialog);
  $scope.canModifyUsers = canModifyUsers;
  $scope.openSpaceInvitationDialog = openSpaceInvitationDialog;

  reload();

  function decorateWithReload (command) {
    return function (...args) {
      return command(...args).then(reload);
    };
  }

  function canModifyUsers () {
    const subscription = spaceContext.subscription;
    const trialLockdown = subscription &&
      subscription.isTrial() && subscription.hasTrialEnded();

    return accessChecker.canModifyUsers() && !trialLockdown;
  }

  function openSpaceInvitationDialog () {
    $scope.isInvitingUsersToSpace = true;

    decorateWithReload(actions.openSpaceInvitationDialog)().finally(() => {
      $scope.isInvitingUsersToSpace = false;
    });
  }

  /**
   * Reset the list with a new data
   */
  function reload () {
    return userListHandler.reset()
    .then(onResetResponse, accessChecker.wasForbidden($scope.context))
    // Refresh token in case the changes affected current user.
    // TODO - handle this in the user action
    .finally(TokenStore.refresh())
    .catch(ReloadNotification.basicErrorHandler);
  }

  function onResetResponse () {
    $scope.spaceUsersCount = userListHandler.getUserCount();
    $scope.by = userListHandler.getGroupedUsers();
    $scope.context.ready = true;
    $scope.jumpToRole();
  }
}]);

angular.module('contentful').factory('UserListController/jumpToRole', ['require', require => {
  const $state = require('$state');
  const spaceContext = require('spaceContext');
  let targetRoleId = null;

  jump.popRoleId = popRoleId;
  return jump;

  function jump (roleId) {
    targetRoleId = roleId;
    if (spaceContext.getEnvironmentId() === 'master') {
      $state.go('spaces.detail.settings.users.list');
    } else {
      $state.go('spaces.detail.environment.settings.users.list');
    }
  }

  function popRoleId () {
    const roleId = targetRoleId;
    targetRoleId = null;
    return roleId;
  }
}]);
