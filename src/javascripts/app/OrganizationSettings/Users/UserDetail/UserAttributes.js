import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { getUserName } from '../UserUtils';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { OrganizationRoleSelector } from './OrganizationRoleSelector';
import { Paragraph, TextLink, Notification } from '@contentful/forma-36-react-components';
import { orgRoles } from 'utils/MembershipUtils';
import SsoExemptionDialog from './SsoExemptionModal';
import ModalLauncher from 'app/common/ModalLauncher';
import ChangeOwnRoleConfirmation from './ChangeOwnRoleConfirmation';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import {
  updateMembership,
  removeMembership
} from 'access_control/OrganizationMembershipRepository';
import RemoveUserConfirmation from '../RemoveUserDialog';
import { go } from 'states/Navigator';

const styles = {
  row: css({
    display: 'grid',
    gap: tokens.spacingL,
    gridAutoFlow: 'column',
    gridTemplateColumns: '1fr 1fr',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL
  }),
  column: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    paddingTop: tokens.spacingL,
    color: tokens.colorTextMid
  }),
  item: css({
    display: 'flex',
    alignItems: 'center'
  }),
  label: css({
    marginRight: tokens.spacingS
  })
};

export default function UserAttributes({ membership, isSelf, onRoleChange, orgId }) {
  const lastActiveAt = membership.sys.lastActiveAt
    ? moment(membership.sys.lastActiveAt, moment.ISO_8601).fromNow()
    : 'Never';
  const memberSince = moment(membership.sys.createdAt, moment.ISO_8601).format('MMMM DD, YYYY');
  const invitedBy = getUserName(membership.sys.createdBy);

  const changeRole = async role => {
    if (isSelf) {
      const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
        <ChangeOwnRoleConfirmation
          isShown={isShown}
          onClose={onClose}
          newRole={role}
          oldRole={membership.role}
        />
      ));

      if (!confirmation) {
        return;
      }
    }

    const endpoint = createOrganizationEndpoint(orgId);
    const { id, version } = membership.sys;

    try {
      const updatedMembership = await updateMembership(endpoint, { id, role, version });
      onRoleChange(updatedMembership);
      Notification.success(`Role successfully changed to ${role}`);
    } catch (e) {
      Notification.error(e.data.message);
    }
  };

  const removeUser = async () => {
    const { id, user } = membership.sys;

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <RemoveUserConfirmation isShown={isShown} onClose={onClose} user={user} />
    ));

    if (!confirmation) {
      return;
    }

    const endpoint = createOrganizationEndpoint(orgId);

    try {
      await removeMembership(endpoint, id);
    } catch (e) {
      Notification.error(e.data.message);
      return;
    }

    if (isSelf) {
      window.location.reload();
    } else {
      go({ path: ['account', 'organizations', 'users', 'list'] });
    }

    const message = user.firstName
      ? `${user.firstName} has been successfully removed from this organization`
      : `Membership successfully removed`;

    Notification.success(message);
  };

  return (
    <div className={styles.row}>
      <ul className={styles.column}>
        <li className={styles.item}>
          <strong className={styles.label}>Last active</strong>
          {lastActiveAt}
        </li>
        <li className={styles.item}>
          <strong className={styles.label}>Member since</strong>
          {memberSince}
        </li>
        <li className={styles.item}>
          <strong className={styles.label}>Invited by</strong>
          {invitedBy}
        </li>
      </ul>
      {membership.sys.sso && <UserSsoInfo membership={membership} />}
      <div>
        <ul className={styles.column}>
          <li className={styles.item}>
            <strong className={styles.label}>Organization role</strong>
            <OrganizationRoleSelector initialRole={membership.role} onChange={changeRole} />
          </li>
          <li>
            <Paragraph>
              {orgRoles.find(role => role.value === membership.role).description}
            </Paragraph>
          </li>
          <li>
            <Paragraph>
              <TextLink linkType="negative" onClick={removeUser}>
                Remove user from organization
              </TextLink>
            </Paragraph>
          </li>
        </ul>
      </div>
    </div>
  );
}

UserAttributes.propTypes = {
  membership: OrganizationMembershipPropType,
  isSelf: PropTypes.bool.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  orgId: PropTypes.string
};

function UserSsoInfo({ membership }) {
  const { isExemptFromRestrictedMode, lastSignInAt } = membership.sys.sso;
  const lastSSOLogin = lastSignInAt ? moment(lastSignInAt).format('dddd, MMMM Do YYYY') : 'Never';
  const exempt = (
    <span onClick={() => showExemptionDialog(membership)}>
      Yes - <TextLink linkType="secondary">See why</TextLink>
    </span>
  );

  return (
    <ul className={styles.column}>
      <li className={styles.item}>
        <strong className={styles.label}>Last SSO login</strong>
        {lastSSOLogin}
      </li>
      <li className={styles.item}>
        <strong className={styles.label}>Exempt from SSO</strong>
        {isExemptFromRestrictedMode ? exempt : 'No'}
      </li>
    </ul>
  );
}

UserSsoInfo.propTypes = {
  membership: OrganizationMembershipPropType.isRequired
};

function showExemptionDialog(membership) {
  ModalLauncher.open(({ onClose, isShown }) => (
    <SsoExemptionDialog isShown={isShown} onClose={onClose} membership={membership} />
  ));
}
