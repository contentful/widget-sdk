'use strict';

angular.module('contentful').directive('cfRoleList', function () {
  return {
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  };
});

angular.module('contentful').controller('RoleListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification  = $injector.get('ReloadNotification');
  var space               = $injector.get('spaceContext').space;
  var $q                  = $injector.get('$q');
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);

  $scope.sref = createSref;
  $scope.notImplemented = function () { window.alert('Not implemented yet.'); };

  $q.all({
    memberships: spaceMembershipRepo.getAll(),
    roles: roleRepo.getAll()
  }).then(function (data) {
    $scope.memberships = countMemberships(data.memberships);
    $scope.roles = data.roles;
    $scope.context.ready = true;
  })
  .catch(ReloadNotification.apiErrorHandler);

  function countMemberships(memberships) {
    var counts = { admin: 0 };

    _.forEach(memberships, function (item) {
      if (item.admin) { counts.admin += 1; }
      _.forEach(item.roles || [], function (role) {
        counts[role.sys.id] = counts[role.sys.id] || 0;
        counts[role.sys.id] += 1;
      });
    });

    return counts;
  }

  function createSref(role, stateName) {
    return 'spaces.detail.settings.roles.' +
      (stateName || 'detail') +
      '({ roleId: \'' + role.sys.id + '\' })';
  }
}]);
