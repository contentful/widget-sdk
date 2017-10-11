import {includes, forEach} from 'lodash';
import {h} from 'ui/Framework';
import { assign } from 'utils/Collections';
import {getFatSpaces} from 'services/TokenStore';
import * as RoleRepository from 'RoleRepository';
import {runTask} from 'utils/Concurrent';
import {ADMIN_ROLE_ID, create as createSpaceRepo} from 'access_control/SpaceMembershipRepository';
import {createEndpoint as createOrgEndpoint, invite as inviteToOrg} from 'access_control/OrganizationMembershipRepository';
import {createSpaceEndpoint} from 'data/Endpoint';
import * as auth from 'Authentication';
import { apiUrl } from 'Config';

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

  let state = {
    spaces: [],
    emails: [],
    invalidAddresses: [],
    orgRole: 'member',
    spaceMemberships: {},
    failedOrgInvitations: []
  };

  const orgEndpoint = createOrgEndpoint($scope.properties.orgId);

  runTask(function* () {
    const allSpaces = yield getFatSpaces();
    const orgSpaces = allSpaces.filter(space => space.data.organization.sys.id === $scope.properties.orgId);
    const spacesWithRolesPromises = orgSpaces.map(space => runTask(function* () {
      const roles = yield RoleRepository.getInstance(space).getAll();
      const spaceRoles = roles.map(role => ({
        name: role.name,
        id: role.sys.id,
        spaceId: role.sys.space.sys.id
      }));

      return {
        id: space.data.sys.id,
        name: space.data.name,
        roles: spaceRoles
      };
    }));
    const spacesWithRoles = yield Promise.all(spacesWithRolesPromises);

    state = assign(state, {
      spaces: spacesWithRoles
    });

    rerender();
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
    submitInvitations: (evt) => {
      evt.preventDefault();
      const {orgRole, emails, invalidAddresses, spaceMemberships} = state;

      if (emails.length && !invalidAddresses.length) {
        const sendSpaceInvitations = (email) => {
          forEach(spaceMemberships, (roles, spaceId) => {
            const spaceEndpoint = createSpaceEndpoint(apiUrl(), spaceId, auth);
            const inviteToSpace = createSpaceRepo(spaceEndpoint).invite;
            inviteToSpace(email, roles);
          });
        };
        const sendOrgInvitation = (email) => {
          inviteToOrg(orgEndpoint, {
            email: email,
            role: orgRole,
            suppressInvitation: false
          }).then(() => {
            sendSpaceInvitations(email);
          });
        };

        forEach(emails, sendOrgInvitation);

        state = assign(state, {
          emails: []  
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
}


function render (
  {emails, orgRole, invalidAddresses, spaces, spaceMemberships},
  {updateEmails, updateOrgRole, updateSpaceRole, submitInvitations}
) {
  return h('.workbench', [
    header(),
    h('form.workbench-main', {
      onSubmit: submitInvitations
    }, [
      h('.workbench-main__content', {
        style: { padding: '2rem 3.15rem' }
      }, [
        emailsInput(emails, invalidAddresses, updateEmails),
        organizationRole(orgRole, updateOrgRole),
        accessToSpaces(spaces, spaceMemberships, updateSpaceRole)
      ]),
      sidebar()
    ])
  ]);
}

function header () {
  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [
      h('h1.workbench-header__title', ['Organization users'])
    ])
  ]);
}

function sidebar () {
  return h('.workbench-main__entity-sidebar', [
    h('.entity-sidebar', [
      h('button.cfnext-btn-primary-action.x--block', {
        type: 'submit'
      }, ['Send invitation']),
      h('.entity-sidebar__heading', {style: {marginTop: '20px'}}, ['Organization role & space role']),
      h('p', ['The organization role controls the level of access to the organization settings.']),
      h('p', ['Access to your organization\'s spaces works independently from that and needs to be defined per space.'])
    ])
  ]);
}

function emailsInput (emails, invalidAddresses, updateEmails) {
  return h('div', [
    h('h3.section-title', ['Select users']),
    h('p', ['Add multiple users by filling in a comma-separated list of email addresses. You can add a maximum of 100 users at a time.']),
    h('.cfnext-form__field.input', [
      h('textarea', {
        dataTestId: 'organization-membership.user-email',
        autofocus: true,
        class: 'cfnext-form__input',
        style: {width: '600px'},
        value: emails.join(', \n'),
        onChange: updateEmails
      }),
      emails.length > 100 ? h('.cfnext-form__field-error', ['Please fill in no more than 100 email addresses.']) : '',
      invalidAddresses.length ? h('.cfnext-form__field-error', [
        h('p', ['The following email addresses are not valid:']),
        h('', [invalidAddresses.join(', ')])
      ]) : ''
    ])
  ]);
}

function organizationRole (orgRole, updateOrgRole) {
  return h('div', [
    h('h3.section-title', ['Organization role']),
    h('fieldset.cfnext-form__field', orgRoles.map(role => {
      return h('.cfnext-form-option', [
        h('label', [
          h('input', {
            name: 'organization_membership_role',
            type: 'radio',
            id: `organization-membership.org-role.${role.value}`,
            checked: role.value === orgRole,
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
    return spaceMemberships.hasOwnProperty(role.spaceId) && includes(spaceMemberships[role.spaceId], role.id);
  }

  function roleCell (role) {
    return h('span.cfnext-form-option', {
      style: { marginBottom: '0' }
    }, [
      h('label', [
        h('input', {
          type: 'checkbox',
          checked: isChecked(role),
          dataTestId: `organization-membership.space.${role.spaceId}.role.${role.name}`,
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
