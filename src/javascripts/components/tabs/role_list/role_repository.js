'use strict';

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
      getAll: getAll,
      get: get,
      create: create,
      save: save
    };

    function getAll() {
      return getBaseCall()
      .payload({ limit: 100 })
      .get().then(function (res) { return res.items; });
    }

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
      config = config || {};
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
    role.policies = []; // @todo handle roles
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
