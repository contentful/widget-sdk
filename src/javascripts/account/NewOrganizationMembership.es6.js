import {groupBy, property} from 'lodash';
import {h} from 'ui/Framework';
import { assign } from 'utils/Collections';
import {getFatSpaces} from 'services/TokenStore';
import * as RoleRepository from 'RoleRepository';
import {ADMIN_ROLE_ID} from 'access_control/SpaceMembershipRepository';
import {runTask} from 'utils/Concurrent';

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const adminRole = {
  name: 'Admin',
  id: ADMIN_ROLE_ID
};
const orgRoles = [
  { name: 'Owner', value: 'owner', description: '' },
  { name: 'Admin', value: 'admin', description: '' },
  { name: 'Member', value: 'member', description: '' }
];

export default function ($scope) {
  $scope.component = h('noscript');

  const initialState = {
    spaceMemberships: {},
    emails: [],
    invalidAddresses: []
  };

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

    let state = assign(initialState, {
      spaces: spacesWithRoles,
      roles: orgRoles
    });

    const actions = {
      updateSpaceRole: (evt, role, spaceMemberships) => {
        const spaceRoles = spaceMemberships[role.spaceId] || [];
        let newSet;

        if (evt.target.checked) {
          newSet = addRole(role, spaceRoles);
        } else {
          newSet = removeRole(role, spaceRoles);
        }

        state = assign(state, {
          spaceMemberships: assign(state.spaceMemberships, {
            [role.spaceId]: newSet
          })
        });

        rerender();
      },
      updateOrgRole: (evt, role) => {
        if (evt.target.checked) {
          state = assign(state, {
            orgRole: role
          });
          rerender();
        }
      },
      /**
       * Receives a string with email addresses
       * separated by comma and transforms it into
       * an array of emails and, possibly, an array with
       * the invalid addresses
       */
      updateEmails: (evt) => {
        const emails = evt.target.value
          .split(',')
          .map(email => email.trim().replace(/\n|\t/g, ''))
          .filter(email => email.length);

        const invalidAddresses = emails
          .filter(email => !emailRegex.test(email));

        state = assign(state, {
          emails,
          invalidAddresses
        });

        rerender();
      }
    };

    rerender();

    function rerender () {
      $scope.properties.context.ready = true;
      $scope.component = render(state, actions);
      $scope.$applyAsync();
    }

    /**
     * Add role id to the set of space roles that will be assigned to the users being invited
     * If the user is Admin, she/he cannot have other assigned roles, and vice-versa
     */
    function addRole (role, spaceRoles) {
      if (role.id === adminRole.id) {
        return [role.id];
      } else {
        return spaceRoles
          .filter((roleId) => roleId !== adminRole.id)
          .concat([role.id]);
      }
    }

    function removeRole (role, spaceRoles) {
      return spaceRoles.filter(id => id !== role.id);
    }
  });
}


function render (
  {emails, orgRole, invalidAddresses, roles, spaces, spaceMemberships},
  {updateEmails, updateOrgRole, updateSpaceRole}
) {
  return h('form', {
    style: {padding: '2em 3em'}
  }, [
    emailsInput(emails, invalidAddresses, updateEmails),
    organizationRole(roles, updateOrgRole),
    accessToSpaces(spaces, spaceMemberships, updateSpaceRole)
  ]);
}

function emailsInput (emails, invalidAddresses, updateEmails) {
  return h('div', [
    h('h3.section-title', ['Select users']),
    h('p', ['Add multiple users by filling in a comma-separated list of email addresses. You can add a maximum of 100 users at a time.']),
    h('.cfnext-form__field.input', [
      h('textarea', {
        autofocus: true,
        class: 'cfnext-form__input',
        style: {width: '600px'},
        value: emails.join(', \n'),
        onChange: updateEmails
      }),
      invalidAddresses.length ? h('.cfnext-form__field-error', [
        h('p', ['The following e-mail addresses are not valid:']),
        h('', [invalidAddresses.join(', ')])
      ]) : ''
    ])
  ]);
}

function organizationRole (roles, updateOrgRole) {
  return h('div', [
    h('h3.section-title', ['Organization role']),
    h('fieldset.cfnext-form__field', roles.map(role => {
      return h('.cfnext-form-option', [
        h('label', [
          h('input', {
            name: 'organization_membership_role',
            type: 'radio',
            id: `organization_membership_role_${role.value}`,
            value: role.value,
            onChange: (evt) => updateOrgRole(evt, role.value)
          }),
          ` ${role.name}`
        ])
      ]);
    }))
  ]);
}

function accessToSpaces (spaces, spaceMemberships, updateSpaceRole) {
  function isChecked (role) {
    return spaceMemberships.hasOwnProperty(role.spaceId) && spaceMemberships[role.spaceId].includes(role.id);
  }

  function roleCell (role) {
    return h('span.cfnext-form-option', {
      style: { marginBottom: '0' }
    }, [
      h('label', [
        h('input', {
          type: 'checkbox',
          checked: isChecked(role),
          onChange: (evt) => updateSpaceRole(evt, role, spaceMemberships)
        }),
        ` ${role.name}`
      ])
    ]);
  }

  return h('div', [
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
              roleCell(assign({spaceId: space.id}, adminRole), updateSpaceRole)
            ].concat(space.roles.map(role => roleCell(role, updateSpaceRole))))
          ])
        ]);
      }))
    ])
  ]);
}
