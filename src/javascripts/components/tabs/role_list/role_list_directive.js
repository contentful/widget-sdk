'use strict';

angular.module('contentful').directive('cfRoleList', function () {
  return {
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  };
});

angular.module('contentful').controller('RoleListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification = $injector.get('ReloadNotification');
  var space              = $injector.get('spaceContext').space;
  var $q                 = $injector.get('$q');
  var RoleRepository     = $injector.get('RoleRepository').getInstance(space);

  $q.all({
    memberships: load('space_memberships'),
    roles: RoleRepository.getAll()
  }).then(function (data) {
    $scope.memberships = countMemberships(data.memberships);
    $scope.roles = prepareRoles(data.roles);
    $scope.context.ready = true;
  });

  function load(what) {
    return space.endpoint(what).payload({ limit: 100 }).rejectEmpty().get();
  }

  function prepareRoles(rolesData) {
    return _.map(rolesData.items, function (role) {
      return {
        id: role.sys.id,
        sref: createSref('detail', role.sys.id),
        name: role.name,
        description: role.description
      };
    });
  }

  function countMemberships(membershipsData) {
    var counts = { admin: 0 };

    _.forEach(membershipsData.items, function (item) {
      if (item.admin) { counts.admin += 1; }
      _.forEach(item.roles || [], function (role) {
        counts[role.sys.id] = counts[role.sys.id] || 0;
        counts[role.sys.id] += 1;
      });
    });

    return counts;
  }

  function createSref(stateName, paramValue) {
    return 'spaces.detail.settings.roles.' +
      stateName + '({ roleId: \'' + paramValue + '\' })';
  }
}]);
