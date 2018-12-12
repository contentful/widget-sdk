import React from 'react';
import { includes, negate, isArray } from 'lodash';
import { h } from 'ui/Framework';
import { assign } from 'utils/Collections.es6';
import { match, isTag } from 'utils/TaggedValues.es6';
import SuccessIcon from 'svg/checkmark-alt.es6';
import pluralize from 'pluralize';
import Icon from 'ui/Components/Icon.es6';

const orgRoles = [
  {
    name: 'Owner',
    value: 'owner',
    description:
      'Organization owners can manage subscriptions, billing and organization memberships.'
  },
  {
    name: 'Admin',
    value: 'admin',
    description:
      'Organization admins cannot manage organization subscriptions nor billing but can manage organization memberships.'
  },
  {
    name: 'Member',
    value: 'member',
    description:
      'Organization members do not have access to any organization information and only have access to assigned spaces.'
  }
];

export function header() {
  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [h('h1.workbench-header__title', ['Invite users'])])
  ]);
}

export function sidebar(
  { Idle, Invalid },
  { status, metadata, suppressInvitation },
  { toggleInvitationEmailOption }
) {
  const isDisabled = match(status, {
    [Idle]: () => false,
    [Invalid]: () => false,
    _: () => true
  });

  const { invitationUsage, invitationLimit, hasSsoEnabled } = metadata;
  const hasInvitationLimit = Boolean(invitationLimit);
  const invitationsRemaining = invitationLimit - invitationUsage;

  return h('.workbench-main__entity-sidebar', [
    h('.entity-sidebar', [
      hasInvitationLimit &&
        h('p', [
          `You have ${invitationsRemaining > 0 ? invitationsRemaining : 0} ${pluralize(
            'invitations',
            invitationsRemaining
          )} left.`
        ]),
      h(
        'button.cfnext-btn-primary-action.x--block',
        {
          type: 'submit',
          disabled: isDisabled
        },
        ['Send invitations']
      ),
      hasSsoEnabled
        ? h('.cfnext-form-option.u-separator--small', [
            h('label', [
              h('input', {
                type: 'checkbox',
                dataTestId: 'organization-membership.suppress-invitation',
                checked: !suppressInvitation,
                onChange: toggleInvitationEmailOption
              }),
              "Inform users that they've been added to the organization via email."
            ])
          ])
        : '',
      h('.entity-sidebar__heading', { style: { marginTop: '20px' } }, [
        'Organization role & space role'
      ]),
      h('p', ['The organization role controls the level of access to the organization settings.']),
      h('p', [
        "Access to your organization's spaces works independently from that and needs to be defined per space."
      ])
    ])
  ]);
}

export function emailsInput(
  maxNumberOfEmails,
  Invalid,
  { emails, emailsInputValue, invalidAddresses, metadata, status },
  { updateEmails, validateEmails }
) {
  const errors = emailInputErrors({
    metadata,
    emails,
    invalidAddresses,
    maxNumberOfEmails,
    status,
    Invalid
  });

  return h('div', [
    h('h3.section-title', ['Add users']),
    h('p', [
      'Add multiple users by filling in a comma-separated list of email addresses. You can add a maximum of 100 users at a time.'
    ]),
    h('.cfnext-form__field.input', [
      h('textarea', {
        dataTestId: 'organization-membership.user-email',
        autoFocus: true,
        class: 'cfnext-form__input org-invitation-emails-field',
        value: emailsInputValue,
        onChange: evt => updateEmails(evt.target.value),
        onBlur: validateEmails
      }),
      ...errors
    ])
  ]);
}

function emailInputErrors({
  metadata,
  emails,
  invalidAddresses,
  maxNumberOfEmails,
  status,
  Invalid
}) {
  const errors = [];
  if (metadata.invitationLimit) {
    const remainingInvitations =
      metadata.invitationLimit - metadata.invitationUsage > 0
        ? metadata.invitationLimit - metadata.invitationUsage
        : 0;

    if (emails.length > remainingInvitations) {
      errors.push(`
        You are trying to invite ${pluralize(
          'users',
          emails.length,
          true
        )} but you only have ${remainingInvitations}
        ${pluralize('invitations', remainingInvitations)} left. Please remove ${pluralize(
        'users',
        emails.length - remainingInvitations,
        true
      )} to proceed.`);
    }
  }
  if (emails.length > maxNumberOfEmails) {
    errors.push(`Please fill in no more than ${maxNumberOfEmails} email addresses.`);
  }
  if (invalidAddresses.length) {
    errors.push([
      h('p', ['The following email addresses are not valid:']),
      h('', [invalidAddresses.join(', ')])
    ]);
  }
  if (!emails.length && isTag(status, Invalid)) {
    errors.push('Please fill in at least one email address.');
  }
  return errors.map(message =>
    h('.cfnext-form__field-error', isArray(message) ? message : [message])
  );
}

export function organizationRole(orgRole, isOwner, updateOrgRole) {
  const isForbiddenOwnerRole = role => !isOwner && role.value === 'owner';

  return h('div', [
    h('h3.section-title', ['Organization role']),
    h(
      'fieldset.cfnext-form__field',
      orgRoles.filter(negate(isForbiddenOwnerRole)).map(role => {
        return h('.cfnext-form-option', [
          h('label', [
            h('input', {
              name: 'organization_membership_role',
              type: 'radio',
              id: `organization-membership.org-role.${role.value}`,
              checked: role.value === orgRole,
              onChange: evt => updateOrgRole(evt.target.checked, role.value)
            }),
            ` ${role.name} `,
            h('span.tooltip-trigger', { style: { position: 'relative' } }, [
              h('i.fa.fa-question-circle'),
              h(
                '.tooltip.fade.top.hidden',
                {
                  style: {
                    width: '200px',
                    bottom: '100%',
                    left: '50%',
                    marginLeft: '-100px'
                  }
                },
                [h('.tooltip-arrow'), h('.tooltip-inner', [role.description])]
              )
            ])
          ])
        ]);
      })
    )
  ]);
}

export function accessToSpaces(
  Loading,
  adminRole,
  { spaces, status, spaceMemberships },
  { updateSpaceRole }
) {
  const isLoading = match(status, {
    [Loading]: () => true,
    _: () => false
  });
  const isEmpty = !isLoading && !spaces.length;

  const isChecked = role => {
    return (
      spaceMemberships.hasOwnProperty(role.spaceId) &&
      includes(spaceMemberships[role.spaceId], role.id)
    );
  };
  const roleCell = role =>
    h(
      'span',
      {
        style: { margin: '0 2em 0 0', display: 'inline-block' }
      },
      [
        h(
          'label',
          {
            style: { whiteSpace: 'nowrap' }
          },
          [
            h('input', {
              type: 'checkbox',
              checked: isChecked(role),
              dataTestId: `organization-membership.space.${role.spaceId}.role.${role.name}`,
              onChange: evt => updateSpaceRole(evt.target.checked, role, spaceMemberships)
            }),
            ` ${role.name}`
          ]
        )
      ]
    );
  const spaceRow = space =>
    h('tr', [
      h('td', [space.name]),
      h('td', [
        h('p', [
          roleCell(assign({ spaceId: space.id }, adminRole), updateSpaceRole),
          ...space.roles.map(role => roleCell(role, updateSpaceRole))
        ])
      ])
    ]);
  const loadingRow = h('tr', [
    h('td', [h('p.u-separator--small', [h('span.spinner--text-inline'), ' Loading your spaces'])])
  ]);

  return h('div', [
    h('h3.section-title', ['Access to spaces']),
    h('p', ['Assign one or multiple roles for each space you want the user to be able to access.']),
    h('table.deprecated-table', [
      h('thead', [
        h('tr', [
          h('th', ['Space']),
          h(
            'th',
            {
              colSpan: '2'
            },
            ['Roles']
          )
        ])
      ]),
      h('tbody', isLoading ? [loadingRow] : spaces.map(spaceRow))
    ]),

    isEmpty ? h('p.u-separator--small', ["You don't have any spaces."]) : ''
  ]);
}

export function progressMessage(emails, successfulOrgInvitations) {
  const isSuccessful = email => includes(successfulOrgInvitations, email);

  return h('', [
    h('.note-box--info', [
      h('h3', [
        `Almost there! ${successfulOrgInvitations.length}/${
          emails.length
        } have been added to your organization`
      ]),
      h('p', ["Please don't close this tab until all users have been added successfully."])
    ]),
    h(
      'ul.pill-list.u-separator--small',
      emails.map(email => {
        const className = isSuccessful(email) ? 'pill-item--success' : 'is-loading';
        const icon = isSuccessful(email) ? h(SuccessIcon) : '';
        return h('li.pill-item', { class: className }, [email, icon]);
      })
    )
  ]);
}

export function errorMessage(useLegacy, failedEmails, restart) {
  const userString = failedEmails.length > 1 ? 'users' : 'user';
  let copy;

  if (useLegacy) {
    copy = (
      <React.Fragment>
        <h3>Whoops! Something went wrong</h3>
        <p>
          The process failed for the following {userString}. Please try to{' '}
          <a onClick={() => restart(failedEmails)}>invite them again</a>.
        </p>
      </React.Fragment>
    );
  } else {
    copy = (
      <React.Fragment>
        <h3>
          {failedEmails.length} {userString} couldn’t be invited
        </h3>
        <p>
          They were either an existing user in the organization or a user that’s already been
          invited. <a onClick={() => restart(failedEmails)}>Go back</a>.
        </p>
      </React.Fragment>
    );
  }

  return (
    <div>
      <div className="note-box--warning">{copy}</div>
      <ul className="pill-list u-separator--small">
        {failedEmails.map(email => (
          <li key={email} className="pill-item pill-item--warning">
            <span className="pill-item__text">{email}</span>
            <Icon name="error" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function successMessage(successfulOrgInvitations, restart, goToList) {
  const userString = successfulOrgInvitations.length > 1 ? 'users have' : 'user has';

  return h('', [
    h('.note-box--success', [
      h('h3', [
        `Yay! ${successfulOrgInvitations.length} ${userString} been invited to your organization`
      ]),
      h('p', [
        'They should receive an invitation email soon. ',
        h(
          'a',
          {
            onClick: () => restart()
          },
          ['Invite more users']
        ),
        ' or ',
        h(
          'a',
          {
            onClick: goToList
          },
          ['go back to the users list']
        ),
        '.'
      ])
    ]),
    h(
      'ul.pill-list.u-separator--small',
      successfulOrgInvitations.map(email => {
        return h('li.pill-item.pill-item--success', [
          h('span.pill-item__text', [email]),
          h(SuccessIcon)
        ]);
      })
    )
  ]);
}
