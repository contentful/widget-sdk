'use strict';

angular.module('contentful').directive('cfUserList', function () {
  return {
    restrict: 'E',
    template: JST['user_list'](),
    controller: 'UserListController'
  };
});

angular.module('contentful').controller('UserListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification = $injector.get('ReloadNotification');
  var space              = $injector.get('spaceContext').space;
  var $q                 = $injector.get('$q');

  var adminMap     = {};
  var roleNameMap  = {};
  var userRolesMap = {};

  $q.all({
    memberships: load('space_memberships'),
    roles: load('roles'),
    users: space.getUsers()
  }).then(function (data) {
    prepareMaps(data.memberships, data.roles);
    $scope.roles = prepareRoles(data.roles);
    $scope.users = prepareUsers(data.users);
    $scope.context.ready = true;
  })
  .catch(ReloadNotification.apiErrorHandler);

  function load(what) {
    return space.endpoint(what).payload({ limit: 100 }).rejectEmpty().get();
  }

  function prepareUsers(users) {
    return _.map(users, function (user) {
      var data = user.data;
      var id = user.getId();

      return {
        id: id,
        sref: createSref('detail', 'userId', id),
        avatar: data.avatarUrl,
        name: data.firstName && data.lastName ? user.getName() : 'Not defined',
        roles: getRolesForUser(id),
        isAdmin: adminMap[id]
      };
    });
  }

  function getRolesForUser(userId) {
    var roleString = _.map(userRolesMap[userId], function (roleId) {
      return roleNameMap[roleId];
    }).join(', ');

    return roleString.length > 0 ? roleString: 'None';
  }

  function prepareRoles(rolesData) {
    return _.map(rolesData.items, function (role) {
      return {
        id: role.sys.id,
        sref: createSref('roleDetail', 'roleId', role.sys.id),
        name: role.name,
        description: role.description,
        hasPolicies: (role.policies || []).length > 0
      };
    });
  }

  function prepareMaps(memberships, roles) {
    _.forEach(memberships.items, function (membership) {
      adminMap[membership.user.sys.id] = membership.admin;
    });

    _.forEach(roles.items, function (role) {
      roleNameMap[role.sys.id] = role.name;
    });

    _.forEach(memberships.items, function (membership) {
      var userId = membership.user.sys.id;
      if (!userRolesMap[userId]) { userRolesMap[userId] = []; }
      _.forEach(membership.roles, function (role) {
        userRolesMap[userId].push(role.sys.id);
      });
    });
  }

  function createSref(stateName, paramName, paramValue) {
    return 'spaces.detail.settings.users.' + stateName +
      '({ ' + paramName + ': \'' + paramValue + '\' })';
  }
}]);
