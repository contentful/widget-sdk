import {includes, sortBy} from 'lodash';
import {h} from 'ui/Framework';
import {assign} from 'utils/Collections';
import {match, isTag} from 'utils/TaggedValues';
import {default as successIcon} from 'svg/checkmark-alt';
import {default as errorIcon} from 'svg/error';

const orgRoles = [
  { name: 'Owner', value: 'owner', description: 'Organization owners can manage subscriptions, billing and organization memberships.' },
  { name: 'Admin', value: 'admin', description: 'Organization admins cannot manage organization subscriptions nor billing but can manage organization memberships.' },
  { name: 'Member', value: 'member', description: 'Organization members do not have access to any organization information and only have access to assigned spaces.' }
];

export function header () {
  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [
      h('h1.workbench-header__title', ['Organization users'])
    ])
  ]);
}

export function sidebar ({
  Idle,
  Invalid
}, {
  status,
  organization,
  suppressInvitation
}, {
  toggleInvitationEmailOption
}) {
  const isDisabled = match(status, {
    [Idle]: () => false,
    [Invalid]: () => false,
    _: () => true
  });

  return h('.workbench-main__entity-sidebar', [
    h('.entity-sidebar', [
      h('p', [`Your organization is using ${organization.membershipsCount} out of ${organization.membershipLimit} users.`]),
      h('button.cfnext-btn-primary-action.x--block', {
        type: 'submit',
        disabled: isDisabled
      }, ['Send invitation']),
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

export function emailsInput (
  maxNumberOfEmails,
  Invalid, {
  emails,
  emailsInputValue,
  invalidAddresses,
  organization,
  status
}, {
  updateEmails,
  validateEmails
}) {
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
        onInput: (evt) => updateEmails(evt.target.value),
        onBlur: validateEmails
      }),
      emails.length > organization.remainingInvitations
        ? h('.cfnext-form__field-error', [`
          You are trying to add ${emails.length} users but you only have ${organization.remainingInvitations}
          more available under your plan. Please remove ${emails.length - organization.remainingInvitations} users to proceed.
          You can upgrade your plan if you need to add more users.
        `]) : '',
      emails.length > maxNumberOfEmails
        ? h('.cfnext-form__field-error', ['Please fill in no more than 100 email addresses.']) : '',
      invalidAddresses.length
        ? h('.cfnext-form__field-error', [
          h('p', ['The following email addresses are not valid:']),
          h('', [invalidAddresses.join(', ')])
        ]) : '',
      !emails.length && isTag(status, Invalid)
        ? h('.cfnext-form__field-error', ['Please fill in at least one email address.']) : ''
    ])
  ]);
}

export function organizationRole (orgRole, updateOrgRole) {
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
            onChange: (evt) => updateOrgRole(evt.target.checked, role.value)
          }),
          ` ${role.name} `,
          h('span.tooltip-trigger', {style: {position: 'relative'}}, [
            h('i.fa.fa-question-circle'),
            h('.tooltip.fade.top.hidden', {
              style: {
                width: '200px',
                bottom: '100%',
                left: '50%',
                marginLeft: '-100px'
              }
            }, [
              h('.tooltip-arrow', {style: {left: '50%'}}),
              h('.tooltip-inner', [role.description])
            ])
          ])
        ])
      ]);
    }))
  ]);
}

export function accessToSpaces (
  Loading,
  adminRole,
  {spaces, status, spaceMemberships},
  {updateSpaceRole}
) {
  const isLoading = match(status, {
    [Loading]: () => true,
    _: () => false
  });
  const isEmpty = !isLoading && !spaces.length;

  function isChecked (role) {
    return spaceMemberships.hasOwnProperty(role.spaceId) && includes(spaceMemberships[role.spaceId], role.id);
  }

  function roleCell (role) {
    return h('span', {
      style: {margin: '0 2em 0 0', display: 'inline-block'}
    }, [
      h('label', {
        style: {whiteSpace: 'nowrap'}
      }, [
        h('input', {
          type: 'checkbox',
          checked: isChecked(role),
          dataTestId: `organization-membership.space.${role.spaceId}.role.${role.name}`,
          onChange: (evt) => updateSpaceRole(evt.target.checked, role, spaceMemberships)
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
      isLoading
        ? h('p.u-separator--small', [
          h('span.spinner--text-inline'),
          ` Loading your spaces.`
        ])
        : h('tbody', sortBy(spaces, space => space.createdAt).map(space => { // sort spaces by creation date
          return h('tr', [
            h('td', [space.name]),
            h('td', [
              h('p', [
                roleCell(assign({spaceId: space.id}, adminRole), updateSpaceRole),
                ...space.roles.map(role => roleCell(role, updateSpaceRole))
              ])
            ])
          ]);
        }))
    ]),

    isEmpty ? h('p.u-separator--small', ['You don\'t have any spaces.']) : ''
  ]);
}

export function progressMessage (emails, successfulOrgInvitations) {
  const isSuccessful = (email) => includes(successfulOrgInvitations, email);

  return h('', [
    h('.note-box--info', [
      h('h3', [`Almost there! ${successfulOrgInvitations.length}/${emails.length} have been added to your organization`]),
      h('p', ['Please don\'t close this tab until all users have been added successfully.'])
    ]),
    h('ul.pill-list.u-separator--small', emails.map(email => {
      const className = isSuccessful(email) ? 'pill-item--success' : 'is-loading';
      const icon = isSuccessful(email) ? successIcon : '';
      return h('li.pill-item', {class: className}, [email, icon]);
    }))
  ]);
}

export function errorMessage (failedEmails, restart) {
  const userString = failedEmails.length > 1 ? 'users' : 'user';

  return h('', [
    h('.note-box--warning', [
      h('h3', ['Whoops! something went wrong']),
      h('p', [
        `The process failed for the following ${userString}. Please try to `,
        h('a', {
          onClick: () => restart(failedEmails)
        }, ['invite them again']),
        '.'
      ])
    ]),
    h('ul.pill-list.u-separator--small', failedEmails.map(email => {
      return h('li.pill-item.pill-item--warning', [
        h('span.pill-item__text', [email]),
        errorIcon
      ]);
    }))
  ]);
}

export function successMessage (emails, successfulOrgInvitations, restart, goToList) {
  const userString = emails.length > 1 ? 'users have' : 'user has';

  return h('', [
    h('.note-box--success', [
      h('h3', [`Yay! ${emails.length} ${userString} been invited to your organization`]),
      h('p', [
        'They should have received an email to confirm the invitation in their inbox. Go ahead and ',
        h('a', {
          onClick: () => restart()
        }, ['invite more users']),
        ' or ',
        h('a', {
          onClick: goToList
        }, ['go back to the users list']),
        '.'
      ])
    ]),
    h('ul.pill-list.u-separator--small', successfulOrgInvitations.map(email => {
      return h('li.pill-item.pill-item--success', [
        h('span.pill-item__text', [email]),
        successIcon
      ]);
    }))
  ]);
}
