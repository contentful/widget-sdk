import {groupBy, property, assign, maxBy} from 'lodash';
import {h} from 'ui/Framework';
import {getFatSpaces} from 'services/TokenStore';
import * as RoleRepository from 'RoleRepository';
import {ADMIN_ROLE_ID} from 'access_control/SpaceMembershipRepository';
import {runTask} from 'utils/Concurrent';

let state = {
  spaceMemberships: {}
};

const actions = {};

const adminRole = {
  name: 'Admin',
  id: ADMIN_ROLE_ID
};

export default function ($scope) {
  $scope.component = h('noscript');

  runTask(function* () {
    const allSpaces = yield getFatSpaces();
    const orgSpaces = allSpaces.filter(space => space.data.organization.sys.id === $scope.properties.orgId);
    const rolesPromise = orgSpaces.map(space => RoleRepository.getInstance(space).getAll());
    const roles = yield Promise.all(rolesPromise);
    const allRoles = roles
      .reduce((a, b) => a.concat(b), [])
      .map(role => ({
        name: role.name,
        id: role.sys.id,
        spaceId: role.sys.space.sys.id
      }));
    const rolesBySpace = groupBy(allRoles, property('spaceId'));
    const spacesWithRoles = orgSpaces.map(space => ({
      id: space.data.sys.id,
      name: space.data.name,
      roles: rolesBySpace[space.data.sys.id]
    }));

    // find space with the largest set of roles
    const largestRoleSet = maxBy(Object.values(rolesBySpace), roles => roles.length);

    state = assign(state, {
      maxNumberOfRoles: largestRoleSet.length + 1, // add 1 for Admin
      spaces: spacesWithRoles
    });

    update();
  });

  function update () {
    $scope.properties.context.ready = true;
    $scope.component = render(state);
    $scope.$applyAsync();
  }

  actions.updateSpaceRole = (evt, role) => {
    if (evt.target.checked) {
      addRole(role);
    } else {
      removeRole(role);
    }

    update();
  };
}

function addRole (role) {
  const { spaceMemberships } = state;
  let spaceRoles = spaceMemberships[role.spaceId] || [];

  if (role.id === adminRole.id) {
    spaceRoles = [role.id];
  } else {
    spaceRoles = spaceRoles.filter((roleId) => roleId !== adminRole.id);
    spaceRoles.push(role.id);
  }

  state.spaceMemberships[role.spaceId] = spaceRoles;
}

function removeRole (role) {
  const { spaceMemberships } = state;
  let spaceRoles = spaceMemberships[role.spaceId];

  spaceRoles = spaceRoles.filter(id => id !== role.id);
  state.spaceMemberships[role.spaceId] = spaceRoles;
}

function isChecked (role) {
  const { spaceMemberships } = state;
  return spaceMemberships.hasOwnProperty(role.spaceId) && spaceMemberships[role.spaceId].includes(role.id);
}

function roleCell (role) {
  return h('td', [
    h('label', [
      h('input', {
        type: 'checkbox',
        checked: isChecked(role),
        onChange: (evt) => actions.updateSpaceRole(evt, role)
      }),
      role.name
    ])
  ]);
}

function render ({spaces, maxNumberOfRoles}) {
  return h('form', {}, [
    h('table.deprecated-table', [
      h('thead', [
        h('th', ['Space']),
        h('th', {
          colspan: `${maxNumberOfRoles}`
        }, ['Roles'])
      ]),
      h('tbody', spaces.map(space => {
        return h('tr', [
          h('td', [space.name]),
          roleCell(assign({spaceId: space.id}, adminRole))
        ].concat(space.roles.map(role => roleCell(role))));
      }))
    ])
  ]);
}
