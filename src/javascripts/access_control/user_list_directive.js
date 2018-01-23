'use strict';

angular.module('contentful').directive('cfUserList', ['require', function (require) {
  var popRoleId = require('UserListController/jumpToRole').popRoleId;
  var $timeout = require('$timeout');
  var getStore = require('TheStore').getStore;
  var store = getStore().forKey('userListView');
  var renderString = require('ui/Framework').renderString;

  var VIEW_BY_NAME = 'name';
  var VIEW_BY_ROLE = 'role';
  var VIEW_LABELS = {};
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
  var accessChecker = require('access_control/AccessChecker');
  var TokenStore = require('services/TokenStore');
  var UserListActions = require('access_control/UserListActions');

  var actions = UserListActions.create(spaceContext, userListHandler, TokenStore);

  $scope.userQuota = {used: 1};
  $scope.$watch(accessChecker.getUserQuota, function (q) { $scope.userQuota = q; });

  $scope.openRemovalConfirmationDialog = decorateWithReload(actions.openRemovalConfirmationDialog);
  $scope.openRoleChangeDialog = decorateWithReload(actions.openRoleChangeDialog);
  $scope.canModifyUsers = canModifyUsers;
  $scope.openSpaceInvitationDialog = openSpaceInvitationDialog;

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

  function openSpaceInvitationDialog () {
    $scope.isInvitingUsersToSpace = true;

    decorateWithReload(actions.openSpaceInvitationDialog)().finally(function () {
      $scope.isInvitingUsersToSpace = false;
    });
  }

  /**
   * Reset the list with a new data
   */
  function reload () {
    return userListHandler.reset()
    .then(onResetResponse, accessChecker.wasForbidden($scope.context))
    .catch(ReloadNotification.basicErrorHandler);
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
