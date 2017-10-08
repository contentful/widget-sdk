import {groupBy, property, assign, maxBy} from 'lodash';
import {h} from 'ui/Framework';
import {getFatSpaces} from 'services/TokenStore';
import * as RoleRepository from 'RoleRepository';
import {ADMIN_ROLE_ID} from 'access_control/SpaceMembershipRepository';
import {runTask} from 'utils/Concurrent';

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

let state = {
  spaceMemberships: {},
  emails: [],
  invalidAddresses: [],
  roles: [
    { name: 'Owner', value: 'owner', description: ''},
    { name: 'Admin', value: 'admin', description: ''},
    { name: 'Member', value: 'member', description: ''}
  ]
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

  actions.updateOrgRole = (evt, role) => {
    if (evt.target.checked) {
      state.orgRole = role;
      update();
    }
  }

  actions.updateEmails = (evt) => {
    state.emails = evt.target.value
      .split(',')
      .map(email => email.trim().replace(/\n|\t/g, ''))
      .filter(email => email.length);
    
    state.invalidAddresses = state.emails
      .filter(email => !emailRegex.test(email));
    
    update();
  }
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
  return h('span.cfnext-form-option', {
    marginBottom: '0'
  }, [
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

function render ({emails, roles, spaces, maxNumberOfRoles, spaceMemberships, orgRole}) {
  return h('form', {
    style: {padding: '2em 3em'}
  }, [
    h('h3.section-title', ['Select users']),
    h('p', ['Add multiple users by filling in a comma-separated list of email addresses. You can add a maximum of 100 users at a time.']),
    h('.cfnext-form__field.input', [
      h('textarea', {
        autofocus: true,
        class: 'cfnext-form__input',
        style: {width: '600px'},
        value: emails.join(', \n'), 
        onChange: actions.updateEmails
      }),
      h('.invalid', [
        h('p', ['The following e-mail addresses are not valid:']),
        h('', [state.invalidAddresses.join(', ')])
      ])
    ]),
    h('h3.section-title', ['Organization role']),
    h('fieldset.cfnext-form__field', roles.map(role => {
      return h('.cfnext-form-option', [
        h('label', [
          h('input', {
            name: 'organization_membership_role',
            type: 'radio', 
            id: `organization_membership_role_${role.value}`,
            value: role.value,
            onChange: (evt) => actions.updateOrgRole(evt, role.value)
          }),
          role.name
        ])
      ])
    })),
    h('h3.section-title', ['Access to spaces']),
    h('p', ['Assign one or multiple roles for each space you want the user to be able to access.']),
    h('table.deprecated-table', [
      h('thead', [
        h('th', ['Space']),
        h('th', {
          colspan: '2'
        }, ['Roles'])
      ]),
      h('tbody', spaces.map(space => {
        return h('tr', [
          h('td', [space.name]),
          h('td', [
            h('.cfnext-form__fieldset--horizontal', [
              roleCell(assign({spaceId: space.id}, adminRole))
            ].concat(space.roles.map(role => roleCell(role))))
          ])
        ])
      }))
    ]),
    h('pre', [JSON.stringify({emails, orgRole, spaceMemberships}, null, 2)]),
  ]);
}
