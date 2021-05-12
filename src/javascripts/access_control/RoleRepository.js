import _ from 'lodash';

const AVAILABLE_PERMISSIONS = {
  ContentModel: ['read', 'manage'],
  ContentDelivery: ['read', 'manage'],
  Settings: ['manage'],
  Environments: ['manage'],
  EnvironmentAliases: ['manage'],
  Tags: ['manage'],
};

const PERMISSION_GROUP_NAME_MAP = {
  ContentModel: 'contentModel',
  ContentDelivery: 'contentDelivery',
  Settings: 'settings',
  Environments: 'environments',
  EnvironmentAliases: 'environmentAliases',
  Tags: 'tags',
};

export function getInstance(cmaClient) {
  return {
    getAll,
    get,
    create,
    save,
    remove,
  };

  function getAll() {
    return cmaClient.role
      .getMany({
        query: {
          limit: 100,
        },
      })
      .then((res) => {
        return res.items;
      });
  }

  function get(id) {
    return cmaClient.role.get({ roleId: id }).then(handleRole);
  }

  function create(role) {
    return cmaClient.role.create({}, map(role)).then(handleRole);
  }

  function save(role) {
    return cmaClient.role.update({ roleId: role.sys.id }, map(role), {}).then(handleRole);
  }

  function remove(role) {
    return cmaClient.role.delete({ roleId: role.sys.id });
  }
}

export function getEmpty() {
  return handleRole({
    policies: [],
    permissions: {
      ContentModel: ['read'],
      ContentDelivery: [],
      Settings: [],
      Environments: [],
      EnvironmentAliases: [],
    },
  });
}

function handleRole(role) {
  role.permissions = rewritePermissions(role.permissions);
  return role;
}

function map(role) {
  role.permissions = flattenPermissions(role.permissions);
  return role;
}

function rewritePermissions(permissions) {
  return _.transform(
    AVAILABLE_PERMISSIONS,
    (acc, names, group) => {
      acc[PERMISSION_GROUP_NAME_MAP[group]] = rewrite(names, group);
    },
    {}
  );

  function rewrite(names, group) {
    if (permissions[group] === 'all') {
      return _.transform(
        names,
        (acc, name) => {
          acc[name] = true;
        },
        {}
      );
    }

    if (_.isArray(permissions[group])) {
      return _.transform(
        names,
        (acc, param) => {
          acc[param] = permissions[group].indexOf(param) > -1;
        },
        {}
      );
    }

    return {};
  }
}

function flattenPermissions(permissions) {
  return _.transform(
    permissions,
    (acc, map, group) => {
      acc[group] = _.transform(
        map,
        (acc, isEnabled, name) => {
          if (isEnabled) {
            acc.push(name);
          }
        },
        []
      );
    },
    {}
  );
}

export default {
  getInstance,
  getEmpty,
};
