/* eslint-disable react/prop-types */

import React from 'react';
import PropTypes from 'prop-types';
import { includes, negate } from 'lodash';
import { match, isTag } from 'utils/TaggedValues.es6';
import SuccessIcon from 'svg/checkmark-alt.es6';
import pluralize from 'pluralize';
import Icon from 'ui/Components/Icon.es6';
import StateLink from 'app/common/StateLink.es6';

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

export function Header() {
  return (
    <div className="workbench-header__wrapper">
      <header className="workbench-header">
        <h1 className="workbench-header__title">Invite users</h1>
      </header>
    </div>
  );
}

export function Sidebar({
  Idle,
  Invalid,
  status,
  metadata,
  suppressInvitation,
  toggleInvitationEmailOption
}) {
  const isDisabled = match(status, {
    [Idle]: () => false,
    [Invalid]: () => false,
    _: () => true
  });

  const { invitationUsage, invitationLimit, hasSsoEnabled } = metadata;
  const hasInvitationLimit = Boolean(invitationLimit);
  const invitationsRemaining = invitationLimit - invitationUsage;

  return (
    <div className="workbench-main__entity-sidebar">
      <div className="entity-sidebar">
        {hasInvitationLimit && (
          <p>
            You have {Math.max(0, invitationsRemaining)}{' '}
            {pluralize('invitations', invitationsRemaining)} left.
          </p>
        )}
        <button className="cfnext-btn-primary-action x--block" type="submit" disabled={isDisabled}>
          Send invitations
        </button>
        {hasSsoEnabled && (
          <div className="cfnext-form-option u-separator--small">
            <label>
              <input
                data-test-id="organization-membership.suppress-invitation"
                type="checkbox"
                checked={!suppressInvitation}
                onChange={toggleInvitationEmailOption}
              />
              {"Inform users that they've been added to the organization via email."}
            </label>
          </div>
        )}
        <div className="entity-sidebar__heading" style={{ marginTop: '20px' }}>
          Organization role & space role
        </div>
        <p>The organization role controls the level of access to the organization settings.</p>
        <p>
          {
            "Access to your organization's spaces works independently from that and needs to be defined per space."
          }
        </p>
      </div>
    </div>
  );
}

export function EmailsInput({
  maxNumberOfEmails,
  Invalid,
  emails,
  emailsInputValue,
  invalidAddresses,
  metadata,
  status,
  updateEmails,
  validateEmails
}) {
  return (
    <div>
      <h3 className="section-title">Add users</h3>
      <p>
        Add multiple users by filling in a comma-separated list of email addresses. You can add a
        maximum of 100 users at a time.
      </p>
      <div className="cfnext-form__field input">
        <textarea
          data-test-id="organization-membership.user-email"
          autoFocus={true}
          className="cfnext-form__input org-invitation-emails-field"
          value={emailsInputValue}
          onChange={evt => updateEmails(evt.target.value)}
          onBlur={validateEmails}
        />
        <EmailInputErrors
          {...{
            metadata,
            emails,
            invalidAddresses,
            maxNumberOfEmails,
            status,
            Invalid
          }}
        />
      </div>
    </div>
  );
}

function EmailInputErrors({
  metadata,
  emails,
  invalidAddresses,
  maxNumberOfEmails,
  status,
  Invalid
}) {
  const errors = [];
  if (metadata.invitationLimit) {
    const remainingInvitations = Math.max(0, metadata.invitationLimit - metadata.invitationUsage);

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
    errors.push(
      <React.Fragment>
        <p>The following email addresses are not valid:</p>
        {invalidAddresses.join(', ')}
      </React.Fragment>
    );
  }
  if (!emails.length && isTag(status, Invalid)) {
    errors.push('Please fill in at least one email address.');
  }
  return errors.map((message, index) => (
    <div key={`error-${index}`} className="cfnext-form__field-error">
      {message}
    </div>
  ));
}

export function OrganizationRole({ orgRole, isOwner, updateOrgRole }) {
  const isForbiddenOwnerRole = role => !isOwner && role.value === 'owner';

  return (
    <div>
      <h3 className="section-title">Organization role</h3>
      <fieldset className="cfnext-form__field">
        {orgRoles.filter(negate(isForbiddenOwnerRole)).map(role => {
          return (
            <div key={role.name} className="cfnext-form-option">
              <label>
                <input
                  name="organization_membership_role"
                  type="radio"
                  id={`organization-membership.org-role.${role.value}`}
                  checked={role.value === orgRole}
                  onChange={evt => updateOrgRole(evt.target.checked, role.value)}
                />{' '}
                {role.name}{' '}
                <span className="tooltip-trigger" style={{ position: 'relative' }}>
                  <i className="fa fa-question-circle" />
                  <div
                    className="tooltip fade top hidden"
                    style={{
                      width: '200px',
                      bottom: '100%',
                      left: '50%',
                      marginLeft: '-100px'
                    }}>
                    <div className="tooltip-arrow" />
                    <div className="tooltip-inner">{role.description}</div>
                  </div>
                </span>
              </label>
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}

export function AccessToSpaces({
  Loading,
  adminRole,
  spaces,
  status,
  spaceMemberships,
  updateSpaceRole
}) {
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
  const RoleCell = ({ role }) => (
    <span style={{ margin: '0 2em 0 0', display: 'inline-block' }}>
      <label style={{ whiteSpace: 'nowrap' }}>
        <input
          data-test-id={`organization-membership.space.${role.spaceId}.role.${role.name}`}
          type="checkbox"
          checked={isChecked(role)}
          onChange={evt => updateSpaceRole(evt.target.checked, role, spaceMemberships)}
        />{' '}
        {role.name}
      </label>
    </span>
  );
  const SpaceRow = ({ space }) => (
    <tr>
      <td>{space.name}</td>
      <td>
        <p>
          <RoleCell role={{ spaceId: space.id, ...adminRole }} />
          {space.roles.map(role => (
            <RoleCell key={role.id} role={role} />
          ))}
        </p>
      </td>
    </tr>
  );

  const LoadingRow = () => (
    <tr>
      <td>
        <p className="u-separator--small">
          <span className="spinner--text-inline" />
          {' Loading your spaces'}
        </p>
      </td>
    </tr>
  );

  return (
    <div>
      <h3 className="section-title">Access to spaces</h3>
      <p>Assign one or multiple roles for each space you want the user to be able to access.</p>
      <table className="deprecated-table">
        <thead>
          <tr>
            <th>Space</th>
            <th colSpan="2">Roles</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <LoadingRow />
          ) : (
            spaces.map(space => <SpaceRow key={space.id} space={space} />)
          )}
        </tbody>
      </table>
      {isEmpty && <p className="u-separator--small">{"You don't have any spaces."}</p>}
    </div>
  );
}

export function ProgressMessage({ emails, successfulOrgInvitations }) {
  const isSuccessful = email => includes(successfulOrgInvitations, email);

  return (
    <React.Fragment>
      <div className="note-box--info">
        <h3>
          Almost there! {successfulOrgInvitations.length}/{emails.length} have been added to your
          organization
        </h3>
        <p>{"Please don't close this tab until all users have been added successfully."}</p>
      </div>
      <ul className="pill-list u-separator--small">
        {emails.map(email => {
          const className = isSuccessful(email) ? 'pill-item--success' : 'is-loading';
          return (
            <li key="email" className={`pill-item ${className}`}>
              {email} {isSuccessful(email) ? <SuccessIcon /> : null}
            </li>
          );
        })}
      </ul>
    </React.Fragment>
  );
}

export function ErrorMessage({ useLegacy, failedEmails, restart }) {
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
          invited.{' '}
          <StateLink to="account.organizations.users.invitations">View invitations</StateLink>.
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

ErrorMessage.propTypes = {
  useLegacy: PropTypes.bool.isRequired,
  failedEmails: PropTypes.array.isRequired,
  restart: PropTypes.func.isRequired
};

export function SuccessMessage({ successfulOrgInvitations }) {
  const userString = successfulOrgInvitations.length > 1 ? 'users have' : 'user has';

  return (
    <React.Fragment>
      <div className=".note-box--success">
        <h3>
          Yay! {successfulOrgInvitations.length} {userString} been invited to your organization
        </h3>
        <p>
          They should receive an invitation email soon.{' '}
          <StateLink to="account.organizations.users.list">Go back to the users list</StateLink>
        </p>
      </div>
      <ul className="pill-list u-separator--small">
        {successfulOrgInvitations.map(email => {
          return (
            <li key="email" className="pill-item pill-item--success">
              <span className="pill-item__text">{email}</span>
              <SuccessIcon />
            </li>
          );
        })}
      </ul>
    </React.Fragment>
  );
}

SuccessMessage.propTypes = {
  successfulOrgInvitations: PropTypes.array.isRequired
};
