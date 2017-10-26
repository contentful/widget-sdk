import {includes, omit, pick, get as getAtPath} from 'lodash';
import {h} from 'ui/Framework';
import { assign } from 'utils/Collections';
import {getFatSpaces, getOrganization} from 'services/TokenStore';
import * as RoleRepository from 'RoleRepository';
import {runTask} from 'utils/Concurrent';
import {ADMIN_ROLE_ID} from 'access_control/SpaceMembershipRepository';
import {makeCtor, match} from 'utils/TaggedValues';
import {invite, progress$} from 'account/SendOrganizationInvitation';
import * as stringUtils from 'stringUtils';
import {go} from 'states/Navigator';

const adminRole = {
  name: 'Admin',
  id: ADMIN_ROLE_ID
};
const maxNumberOfEmails = 100;
const orgRoles = [
  { name: 'Owner', value: 'owner', description: '' },
  { name: 'Admin', value: 'admin', description: '' },
  { name: 'Member', value: 'member', description: '' }
];
const Idle = makeCtor('idle');
const InProgress = makeCtor('inProgress');
const Success = makeCtor('success');
const Failure = makeCtor('failure');

export default function ($scope) {
  const orgId = $scope.properties.orgId;
  const offProgressValue = progress$.onValue(onProgressValue);
  const offProgressError = progress$.onError(onProgressError);

  let state = {
    spaces: [],
    emails: [],
    emailsInputValue: '',
    invalidAddresses: [],
    orgRole: 'member',
    spaceMemberships: {},
    failedOrgInvitations: [],
    successfulOrgInvitations: [],
    status: Idle(),
    organization: {}
  };

  $scope.component = h('noscript');
  $scope.$on('$destroy', () => {
    offProgressValue();
    offProgressError();
  });

  runTask(function* () {
    const org = yield getOrganization(orgId);
    const allSpaces = yield getFatSpaces();
    const orgSpaces = allSpaces.filter(space => space.data.organization.sys.id === orgId);
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
      spaces: spacesWithRoles,
      organization: {
        hasSsoEnabled: org.hasSsoEnabled,
        membershipLimit: getAtPath(org, 'subscriptionPlan.limits.permanent.organizationMembership'),
        membershipsCount: getAtPath(org, 'usage.permanent.organizationMembership')
      }
    });

    rerender();
  });

  const actions = {
    updateSpaceRole: (evt, role, spaceMemberships) => {
      const spaceRoles = spaceMemberships[role.spaceId] || [];
      let newSpaceRoles;
      let updatedMemberships;

      if (evt.target.checked) {
        newSpaceRoles = addRole(role, spaceRoles);
      } else {
        newSpaceRoles = removeRole(role, spaceRoles);
      }

      if (newSpaceRoles.length) {
        updatedMemberships = assign(state.spaceMemberships, {
          [role.spaceId]: newSpaceRoles
        });
      } else {
        // remove property if there are no roles left in it
        updatedMemberships = omit(state.spaceMemberships, [role.spaceId]);
      }

      state = assign(state, {
        spaceMemberships: updatedMemberships
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
     * Send invitations to the organization to all emails in the form
     * If the org invitation succeeds (or if it fails with 422 (taken), automatically
     * proceeds to invite the user to all selected spaces with respective roles
     */
    submitInvitations: (evt) => {
      evt.preventDefault();

      const {
        orgRole,
        emails,
        invalidAddresses,
        failedOrgInvitations,
        spaceMemberships,
        suppressInvitation
      } = state;

      if (emails.length && emails.length <= maxNumberOfEmails && !invalidAddresses.length) {
        invite({
          emails,
          orgRole,
          spaceMemberships,
          suppressInvitation,
          orgId
        }).then(() => {
          state = assign(state, {
            status: failedOrgInvitations.length ? Failure() : Success()
          });
          rerender();
        });

        state = assign(state, {
          status: InProgress()
        });

        rerender();
      }
    },

    /**
     * Toggle flag `suppressInvitation` that goes in the org invitation call.
     * This flag indicates whether or not we should send an email to the invited
     * users saying they were invited.
     */
    toggleInvitationEmailOption: () => {
      state = assign(state, {
        suppressInvitation: !state.suppressInvitation
      });
    },

    /**
     * Restart the form, seting the status to `Idle`, and keeping the selected
     * orgRole and space roles.
     * It also enables to restart with a given list of emails.
     * @param {Array<String>} emails
     */
    restart: (evt, emails = []) => {
      evt.preventDefault();

      state = assign(state, {
        emails: emails,
        emailsInputValue: emails.join(', '),
        status: Idle(),
        failedOrgInvitations: [],
        successfulOrgInvitations: []
      });

      rerender();
    },

    /**
     * Navigate to organization users list
     */
    goToList: (evt) => {
      evt.preventDefault();
      go({
        path: ['account', 'organizations', 'users', 'gatekeeper']
      });
    },
    /**
     * Receives a string with email addresses
     * separated by comma and transforms it into
     * an array of emails and, possibly, an array with
     * the invalid addresses.
     */
    updateEmails: (evt) => {
      const emails = evt.target.value
        .split(',')
        .map(email => email.trim().replace(/\n|\t/g, ''))
        .filter(email => email.length);

      const invalidAddresses = emails
        .filter(email => !stringUtils.isValidEmail(email));

      state = assign(state, {
        emailsInputValue: evt.target.value,
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

  function onProgressValue (email) {
    state = assign(state, {
      successfulOrgInvitations: state.successfulOrgInvitations.concat([email])
    });
    rerender();
  }

  function onProgressError (email) {
    state.failedOrgInvitations.push(email);
  }
}

function render (state, actions) {
  return h('.workbench', [
    header(),
    h('form.workbench-main', {
      dataTestId: 'organization-membership.form',
      onSubmit: actions.submitInvitations
    }, [
      h('.workbench-main__content', {
        style: { padding: '2rem 3.15rem' }
      }, [
        match(state.status, {
          [Success]: () => successMessage(state.emails, actions.restart, actions.goToList),
          [Failure]: () => errorMessage(state.failedOrgInvitations, actions.restart),
          [InProgress]: () => progressMessage(state.emails, state.successfulOrgInvitations),
          [Idle]: () => h('', [
            emailsInput(
              pick(state, ['emails', 'emailsInputValue', 'invalidAddresses', 'organization']),
              pick(actions, ['updateEmails'])
            ),
            organizationRole(state.orgRole, actions.updateOrgRole),
            accessToSpaces(state.spaces, state.spaceMemberships, actions.updateSpaceRole)
          ])
        })
      ]),
      sidebar(
        pick(state, ['status', 'emails', 'organization', 'suppressInvitation']),
        pick(actions, ['toggleInvitationEmailOption'])
      )
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

function sidebar ({
  status,
  emails,
  organization,
  suppressInvitation
}, {
  toggleInvitationEmailOption
}) {
  const isDisabled = match(status, {
    [Idle]: () => false,
    _: () => true
  });

  return h('.workbench-main__entity-sidebar', [
    h('.entity-sidebar', [
      h('p', [`Your organization is using ${organization.membershipsCount} out of ${organization.membershipLimit} users.`]),
      h('button.cfnext-btn-primary-action.x--block', {
        type: 'submit',
        disabled: isDisabled
      }, [
        'Send invitation',
        emails.length > 1 ? ` to ${emails.length} users` : ''
      ]),
      organization.hasSsoEnabled ? h('.cfnext-form-option.u-separator--small', [
        h('label', [
          h('input', {
            type: 'checkbox',
            dataTestId: 'organization-membership.suppress-invitation',
            checked: !suppressInvitation,
            onChange: toggleInvitationEmailOption
          }),
          'Inform users that they\'ve been added to the organization via email.'
        ])
      ]) : '',
      h('.entity-sidebar__heading', {style: {marginTop: '20px'}}, ['Organization role & space role']),
      h('p', ['The organization role controls the level of access to the organization settings.']),
      h('p', ['Access to your organization\'s spaces works independently from that and needs to be defined per space.'])
    ])
  ]);
}

function emailsInput ({
  emails,
  emailsInputValue,
  invalidAddresses,
  organization
}, {
  updateEmails
}) {
  const remainingInvitations = organization.membershipLimit - organization.membershipsCount;

  return h('div', [
    h('h3.section-title', ['Select users']),
    h('p', ['Add multiple users by filling in a comma-separated list of email addresses. You can add a maximum of 100 users at a time.']),
    h('.cfnext-form__field.input', [
      h('textarea', {
        dataTestId: 'organization-membership.user-email',
        autofocus: true,
        class: 'cfnext-form__input',
        style: {width: '600px'},
        value: emailsInputValue,
        onChange: updateEmails
      }),
      emails.length > remainingInvitations ? h('.cfnext-form__field-error', [`
        You are trying to add ${emails.length} users but you only have ${remainingInvitations} 
        more available under your plan. Please remove ${emails.length - remainingInvitations} users to proceed. 
        You can upgrade your plan if you need to add more users.
      `]) : '',
      emails.length > maxNumberOfEmails ? h('.cfnext-form__field-error', ['Please fill in no more than 100 email addresses.']) : '',
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

function progressMessage (emails, successfulOrgInvitations) {
  return h('', [
    h('.note-box--info', [
      h('h3', [`Almost there! ${successfulOrgInvitations.length}/${emails.length} have been added to your organization`]),
      h('p', ['Please don\'t close this tab until all users have been added successfully'])
    ]),
    h('ul.pill-list.u-separator--small', emails.map(email => {
      const className = includes(successfulOrgInvitations, email) ? '' : 'is-loading';
      return h('li.pill-item', {class: className}, [email]);
    }))
  ]);
}

function errorMessage (failedEmails, restart) {
  const userString = failedEmails.length > 1 ? 'users' : 'user';

  return h('', [
    h('.note-box--warning', [
      h('h3', ['Whoops! something went wrong']),
      h('p', [
        `The process failed for the following ${userString}. Please try to `,
        h('a', {
          onClick: (evt) => restart(evt, failedEmails)
        }, ['invite them again.'])
      ])
    ]),
    h('ul.pill-list.u-separator--small', failedEmails.map(email => {
      return h('li.pill-item', [email]);
    }))
  ]);
}

function successMessage (emails, restart, goToList) {
  const userString = emails.length > 1 ? 'users have' : 'user has';

  return h('.note-box--success', [
    h('h3', [`Yay! ${emails.length} ${userString} been invited to your organization`]),
    h('p', [
      'They should have received an email to confirm the invitation in their inbox. Go ahead and ',
      h('a', {
        onClick: restart
      }, ['invite more users']),
      ' or ',
      h('a', {
        onClick: goToList
      }, ['go back to the users list.'])
    ])
  ]);
}
