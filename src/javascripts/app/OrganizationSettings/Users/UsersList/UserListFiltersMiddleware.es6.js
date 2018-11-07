import { isNil, uniqBy, findIndex, find } from 'lodash';

const filterKeys = {
  ROLE_IN_ANY_SPACE: 'sys.spaceMemberships.roles.name',
  ROLE_IN_SPACE: 'sys.spaceMemberships.roles.sys.id',
  ADMIN_IN_ANY_SPACE: 'sys.spaceMemberships.admin',
  ADMIN_IN_SPACE: 'is_admin_of_space'
};
const getDefaultOptions = spaceId => [
  { label: 'Any', value: '' },
  // if a space is selected in the space filter
  // and admin is selected in the space role filter
  // key is 'is_admin_of_space' and value is the space id
  // otherwise,
  // key is 'sys.spaceMemberships.admin' and value is 'true'
  { label: 'Admin', value: spaceId ? spaceId : 'true' }
];

const isActiveFilter = definition => {
  const value = definition.filter.value;
  return !isNil(value) && value !== '';
};

const getRoleOptions = roles => {
  const options = uniqBy(roles, 'name')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(role => ({ label: role.name, value: role.name }));

  return getDefaultOptions().concat(options);
};

const getSpaceRoleOptions = (roles, spaceId) => {
  const options = roles
    .filter(role => role.sys.space.sys.id === spaceId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(role => ({ label: role.name, value: role.sys.id }));

  return getDefaultOptions(spaceId).concat(options);
};

export default function createMiddleware(spaceRoles) {
  return {
    update(oldFilters, newFilters) {
      const spaceRoleFilter = newFilters.find(f => f.id === 'spaceRole');
      const spaceFilter = newFilters.find(f => f.id === 'space');
      const oldSpaceRoleFilter = oldFilters.find(f => f.id === 'spaceRole');
      const oldSpaceFilter = oldFilters.find(f => f.id === 'space');
      const selectedSpaceValue = spaceFilter.filter.value;
      const selectedRoleValue = spaceRoleFilter.filter.value;
      const isSpaceSelected = isActiveFilter(spaceFilter);
      const wasSpaceSelected = isActiveFilter(oldSpaceFilter);
      const isRoleSelected = isActiveFilter(spaceRoleFilter);
      const oldSelectedSpaceValue = oldSpaceFilter.filter.value;
      const oldSelectedRoleValue = oldSpaceRoleFilter.filter.value;
      const oldOptions = oldSpaceRoleFilter.options;
      const oldSelectedRoleOption = oldOptions.find(o => o.value === oldSelectedRoleValue);
      const selectedRoleOption = spaceRoleFilter.options.find(o => o.value === selectedRoleValue);
      const isAdminSelected = isRoleSelected && selectedRoleOption.label === 'Admin'; // TODO: refine this definition
      const conditions = {
        JUST_ROLE: isRoleSelected && !isAdminSelected && !isSpaceSelected,
        ROLE_IN_SPACE: isRoleSelected && !isAdminSelected && isSpaceSelected,
        ADMIN_IN_SPACE: isAdminSelected && isSpaceSelected,
        JUST_ADMIN: isAdminSelected && !isSpaceSelected
      };

      const transitions = {
        SELECTED_SPACE: !wasSpaceSelected && isSpaceSelected,
        CHANGED_SPACE:
          wasSpaceSelected && isSpaceSelected && oldSelectedSpaceValue !== selectedSpaceValue,
        DESELECTED_SPACE: wasSpaceSelected && !isSpaceSelected
      };

      let key;
      let value = spaceRoleFilter.filter.value;

      const options = isSpaceSelected
        ? getSpaceRoleOptions(spaceRoles, selectedSpaceValue)
        : getRoleOptions(spaceRoles);

      if (conditions.JUST_ROLE) {
        key = filterKeys.ROLE_IN_ANY_SPACE;
      } else if (conditions.ROLE_IN_SPACE) {
        key = filterKeys.ROLE_IN_SPACE;
      } else if (conditions.ADMIN_IN_SPACE) {
        key = filterKeys.ADMIN_IN_SPACE;
      } else if (conditions.JUST_ADMIN) {
        key = filterKeys.ADMIN_IN_ANY_SPACE;
      }

      if (
        isRoleSelected &&
        (transitions.SELECTED_SPACE || transitions.CHANGED_SPACE || transitions.DESELECTED_SPACE)
      ) {
        // try to find the same role (by name) in the new space, or return empty string
        const newRoleOption = find(options, o => o.label === oldSelectedRoleOption.label);
        value = newRoleOption ? newRoleOption.value : '';
      }

      const spaceRoleFilterIndex = findIndex(newFilters, f => f.id === 'spaceRole');
      newFilters[spaceRoleFilterIndex] = {
        ...spaceRoleFilter,
        options,
        filter: {
          key,
          value
        }
      };
    }
  };
}
