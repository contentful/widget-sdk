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

  $scope.selectedListView = 'name';
  $scope.removeFromSpace  = removeFromSpace;

  reload().catch(ReloadNotification.basicErrorHandler);

  function removeFromSpace(user) {
    if (!listHandler.isLastAdmin(user.id)) {
      remove();
      return;
    }

    modalDialog.openConfirmDeleteDialog({
      title: 'Removing last admin',
      message: 'Are you sure?',
      confirmLabel: 'Remove'
    }).promise.then(remove);

    function remove() {
      spaceMembershipRepo.remove(user.membershipId)
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
}]);
