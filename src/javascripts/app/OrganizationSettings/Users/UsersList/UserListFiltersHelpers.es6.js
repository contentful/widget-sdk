import { uniqBy, find, cloneDeep } from 'lodash';
import { flow } from 'lodash/fp';

const SPACE_FILTER_KEYS = ['sys.spaceMemberships.sys.space.sys.id'];

const SPACE_ROLE_FILTER_ADMIN_KEYS = ['sys.spaceMemberships.admin', 'is_admin_of_space'];

const SPACE_ROLE_FILTER_KEYS = [
  'sys.spaceMemberships.roles.name',
  'sys.spaceMemberships.roles.sys.id'
].concat(SPACE_ROLE_FILTER_ADMIN_KEYS);

const defaultRoleOptions = (options, spaceId) => {
  return [
    { label: 'Any', value: '' },

    /*
      The option value for the Admin "role" changes depending
      on if we are asking for the admin role in a space "context"
      or not.

      If in a space context, the key given in the query to the API
      is `is_admin_of_space` and the value is the `spaceId`.

      If not in space context, the API query key is `sys.spaceMemberships.admin`
      and the value is `true`.
     */
    { label: 'Admin', value: spaceId ? spaceId : 'true' }
  ].concat(options);
};

const getRoleOptions = roles => {
  const options = uniqBy(roles, 'name')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(role => ({ label: role.name, value: role.name }));

  return defaultRoleOptions(options);
};

const getSpaceRoleOptions = (roles, spaceId) => {
  const options = roles
    .filter(role => role.sys.space.sys.id === spaceId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(role => ({ label: role.name, value: role.sys.id }));

  return defaultRoleOptions(options, spaceId);
};

function handleUpdatedSpaceFilter({ allSpaceRoles, filterDefs, updatedFilter }) {
  const spaceFilterUpdated = SPACE_FILTER_KEYS.includes(updatedFilter.key);

  if (!spaceFilterUpdated) {
    return { allSpaceRoles, filterDefs, updatedFilter };
  }

  const roleFilterDef = filterDefs.find(f => f.id === 'spaceRole');
  const roleFilterKeyIsAdmin = SPACE_ROLE_FILTER_ADMIN_KEYS.includes(roleFilterDef.filter.key);
  const updatedFilterHasValue = updatedFilter.value !== '';

  let roleFilterOptions;

  if (updatedFilterHasValue) {
    roleFilterOptions = getSpaceRoleOptions(allSpaceRoles, updatedFilter.value);
  } else {
    roleFilterOptions = getRoleOptions(allSpaceRoles);
  }

  /*
    filter: {
      key: 'is_admin_of_space',
      value: spaceId
    }
   */
  if (updatedFilterHasValue && roleFilterKeyIsAdmin) {
    roleFilterDef.filter.key = 'is_admin_of_space';
    roleFilterDef.filter.value = updatedFilter.value;
  }

  /*
    filter: {
      key: 'sys.spaceMemberships.roles.sys.id',
      value: roleId
    }
   */
  if (updatedFilterHasValue && !roleFilterKeyIsAdmin) {
    roleFilterDef.filter.key = 'sys.spaceMemberships.roles.sys.id';

    const newRoleOption = find(roleFilterOptions, o => o.label === roleFilterDef.filter.value);
    roleFilterDef.filter.value = newRoleOption ? newRoleOption.value : '';
  }

  /*
    filter: {
      key: 'sys.spaceMemberships.admin',
      value: true
    }
   */
  if (!updatedFilterHasValue && roleFilterKeyIsAdmin) {
    roleFilterDef.filter.key = 'sys.spaceMemberships.admin';
    roleFilterDef.filter.value = 'true';
  }

  /*
    filter: {
      key: 'sys.spaceMemberships.roles.name',
      value: roleName
    }
   */
  if (!updatedFilterHasValue && !roleFilterKeyIsAdmin) {
    roleFilterDef.filter.key = 'sys.spaceMemberships.roles.name';

    const roleFilterRole = allSpaceRoles.find(r => r.sys.id === roleFilterDef.filter.value);
    roleFilterDef.filter.value = roleFilterRole ? roleFilterRole.name : '';
  }

  // Set the options last so that the option searching that happens above happens on the existing
  // options, not the new ones
  roleFilterDef.options = roleFilterOptions;

  return { allSpaceRoles, filterDefs, updatedFilter };
}

function handleUpdatedRoleFilter({ allSpaceRoles, filterDefs, updatedFilter }) {
  const roleFilterUpdated = SPACE_ROLE_FILTER_KEYS.includes(updatedFilter.key);

  if (!roleFilterUpdated) {
    return { allSpaceRoles, filterDefs, updatedFilter };
  }

  const roleFilterDef = filterDefs.find(f => f.id === 'spaceRole');
  const spaceFilterDef = filterDefs.find(f => f.id === 'space');

  const spaceFilterDefHasValue = spaceFilterDef.filter.value !== '';

  let roleFilterUpdatedToAdmin = false;

  const option = roleFilterDef.options.find(o => o.value === updatedFilter.value);

  if (option.label === 'Admin') {
    roleFilterUpdatedToAdmin = true;
  }

  /*
    filter: {
      key: 'is_admin_of_space',
      value: spaceId
    }
   */
  if (roleFilterUpdatedToAdmin && spaceFilterDefHasValue) {
    updatedFilter.key = 'is_admin_of_space';
    updatedFilter.value = spaceFilterDef.filter.value;
  }

  /*
    filter: {
      key: 'sys.spaceMemberships.admin',
      value: true
    }
   */
  if (roleFilterUpdatedToAdmin && !spaceFilterDefHasValue) {
    updatedFilter.key = 'sys.spaceMemberships.admin';
    updatedFilter.value = 'true';
  }

  /*
    filter: {
      key: 'sys.spaceMemberships.roles.sys.id',
      value: roleId
    }
   */
  if (!roleFilterUpdatedToAdmin && spaceFilterDefHasValue) {
    updatedFilter.key = 'sys.spaceMemberships.roles.sys.id';
  }

  /*
    filter: {
      key: 'sys.spaceMemberships.roles.name',
      value: roleName
    }
   */
  if (!roleFilterUpdatedToAdmin && !spaceFilterDefHasValue) {
    updatedFilter.key = 'sys.spaceMemberships.roles.name';
  }

  return { allSpaceRoles, filterDefs, updatedFilter };
}

function update({ filterDefs, updatedFilter }) {
  const roleFilterUpdated = SPACE_ROLE_FILTER_KEYS.includes(updatedFilter.key);

  return filterDefs.map(def => {
    // spaceRole filter definition has 4 possible keys
    if (roleFilterUpdated && def.id === 'spaceRole') {
      def.filter = updatedFilter;
    } else if (def.filter.key === updatedFilter.key) {
      def.filter = updatedFilter;
    }

    return def;
  });
}

export function updateDependentFilterDefs(allSpaceRoles, filterDefs, updatedFilter) {
  const clonedUpdatedFilter = cloneDeep(updatedFilter);
  const clonedFilterDefs = cloneDeep(filterDefs);

  return flow(
    handleUpdatedSpaceFilter,
    handleUpdatedRoleFilter,
    update
  )({ allSpaceRoles, filterDefs: clonedFilterDefs, updatedFilter: clonedUpdatedFilter });
}
