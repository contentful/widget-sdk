'use strict';

angular.module('contentful').directive('cfRoleEditor', function () {
  return {
    restrict: 'E',
    template: JST['role_editor'](),
    controller: 'RoleEditorController'
  };
});

angular.module('contentful').controller('RoleEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var Command        = $injector.get('command');
  var RoleRepository = $injector.get('RoleRepository');
  var $state         = $injector.get('$state');
  var spaceContext   = $injector.get('spaceContext');

  $scope.$watch('role.name', function (name) {
    $scope.context.title = getId() ? name : 'New role';
  });

  $scope.$watch('roleForm.$dirty', function (isDirty) {
    $scope.context.dirty = isDirty;
  });

  $scope.save = Command.create(function () {
    var roleRepository = RoleRepository.getInstance(spaceContext.space);
    return roleRepository.save($scope.role).then(function (role) {
      $scope.role = role;
      $scope.roleForm.$setPristine();
      $scope.context.dirty = false;
    });
  });

  $scope.delete = Command.create(function () {
    // @todo DELETE
  }, {
    available: function () {
      return !$scope.context.isNew && getId();
    }
  });

  $scope.cancel = Command.create(function () {
    // @todo confirmation dialog
    return $state.go('^.list');
  }, {
    available: function () {
      return $scope.context.isNew;
    }
  });

  function getId() {
    return dotty.get($scope, 'role.sys.id');
  }
}]);

angular.module('contentful').factory('RoleRepository', [function () {

  var AVAILABLE_PERMISSIONS = {
    ContentModel: ['read', 'manage'],
    ContentDelivery: ['read', 'manage'],
    Settings: ['manage']
  };

  var PERMISSION_GROUP_NAME_MAP = {
    ContentModel: 'contentModel',
    ContentDelivery: 'contentDelivery',
    Settings: 'settings'
  };

  return { getInstance: getInstance };

  function getInstance(space) {

    return {
      get: get,
      create: create,
      save: save
    };

    function get(id) {
      return getBaseCall({id: id})
      .get()
      .then(handleRole);
    }

    function create(role) {
      return getBaseCall()
      .payload(map(role))
      .post();
    }

    function save(role) {
      return getBaseCall({
        id: role.sys.id,
        version: role.sys.version
      })
      .payload(map(role))
      .put()
      .then(handleRole);
    }

    function getBaseCall(config) {
      var headers = {};
      if (config.version) {
        headers['X-Contentful-Version'] = config.version;
      }

      return space.endpoint('roles', config.id)
      .headers(headers)
      .rejectEmpty();
    }
  }

  function handleRole(role) {
    role.permissions = rewritePermissions(role.permissions);
    role.policies = [];
    return role;
  }

  function map(role) {
    role = _.omit(role, 'sys');
    role.permissions = flattenPermissions(role.permissions);
    return role;
  }

  function rewritePermissions(permissions) {
    return _.transform(AVAILABLE_PERMISSIONS, function (acc, names, group) {
      acc[PERMISSION_GROUP_NAME_MAP[group]] = rewrite(names, group);
    }, {});

    function rewrite(names, group) {
      if (permissions[group] === 'all') {
        return _.transform(names, function (acc, name) {
          acc[name] = true;
        }, {});
      }

      if (_.isArray(permissions[group])) {
        return _.transform(names, function (acc, param) {
          acc[param] = permissions[group].indexOf(param) > -1;
        }, {});
      }

      return {};
    }
  }

  function flattenPermissions(permissions) {
    return _.transform(permissions, function (acc, map, group) {
      acc[group] = _.transform(map, function (acc, isEnabled, name) {
        if (isEnabled) { acc.push(name); }
      }, []);
    }, {});
  }
}]);
