'use strict';

angular.module('contentful').factory('RoleRepository', [() => {

  var AVAILABLE_PERMISSIONS = {
    ContentModel: ['read', 'manage'],
    ContentDelivery: ['read', 'manage'],
    Settings: ['manage'],
    Environments: ['manage']
  };

  var PERMISSION_GROUP_NAME_MAP = {
    ContentModel: 'contentModel',
    ContentDelivery: 'contentDelivery',
    Settings: 'settings',
    Environments: 'environments'
  };

  return {
    getInstance: getInstance,
    getEmpty: getEmpty
  };

  function getInstance(space) {

    return {
      getAll: getAll,
      get: get,
      create: create,
      save: save,
      remove: remove
    };

    function getAll() {
      return getBaseCall()
      .payload({ limit: 100 })
      .get().then(res => res.items);
    }

    function get(id) {
      return getBaseCall({id: id})
      .get()
      .then(handleRole);
    }

    function create(role) {
      return getBaseCall()
      .payload(map(role))
      .post()
      .then(handleRole);
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

    function remove(role) {
      return getBaseCall({
        id: role.sys.id,
        rejectEmpty: false
      })
      .delete();
    }

    function getBaseCall(config) {
      var headers = {};
      config = config || {};
      if (config.version) {
        headers['X-Contentful-Version'] = config.version;
      }

      var call = space.endpoint('roles', config.id).headers(headers);
      return config.rejectEmpty ? call.rejectEmpty() : call;
    }
  }

  function getEmpty() {
    return handleRole({
      policies: [],
      permissions: {
        ContentModel: ['read'],
        ContentDelivery: [],
        Settings: [],
        Environments: []
      }
    });
  }

  function handleRole(role) {
    role.permissions = rewritePermissions(role.permissions);
    return role;
  }

  function map(role) {
    role = _.omit(role, ['sys']);
    role.permissions = flattenPermissions(role.permissions);
    return role;
  }

  function rewritePermissions(permissions) {
    return _.transform(AVAILABLE_PERMISSIONS, (acc, names, group) => {
      acc[PERMISSION_GROUP_NAME_MAP[group]] = rewrite(names, group);
    }, {});

    function rewrite(names, group) {
      if (permissions[group] === 'all') {
        return _.transform(names, (acc, name) => {
          acc[name] = true;
        }, {});
      }

      if (_.isArray(permissions[group])) {
        return _.transform(names, (acc, param) => {
          acc[param] = permissions[group].indexOf(param) > -1;
        }, {});
      }

      return {};
    }
  }

  function flattenPermissions(permissions) {
    return _.transform(permissions, (acc, map, group) => {
      acc[group] = _.transform(map, (acc, isEnabled, name) => {
        if (isEnabled) { acc.push(name); }
      }, []);
    }, {});
  }
}]);
