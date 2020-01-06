import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  IconButton,
  Typography,
  Tooltip,
  TextLink
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import { websiteUrl } from 'Config';
import { User as UserPropType } from './propTypes';
import IdentitiesSection from './IdentitiesSection';
import UserEditModal from './UserEditModal';
import ChangePasswordModal from './ChangePasswordModal';
import * as ModalLauncher from 'app/common/ModalLauncher';

const styles = {
  spaceLeft: css({
    marginLeft: tokens.spacingXs,
    cursor: 'pointer'
  }),
  accountImage: css({
    height: '75px',
    width: '75px',
    marginTop: tokens.spacing2Xs,
    borderRadius: '50%'
  }),
  flexContainer: css({
    display: 'flex',
    flexWrap: 'nowrap'
  }),
  column: css({
    display: 'flex',
    flexDirection: 'column'
  }),
  flexGrow1: css({
    flexGrow: 1
  }),
  typographyContainer: css({
    paddingLeft: tokens.spacingL,
    width: '620px'
  }),
  paddingTopS: css({
    paddingTop: tokens.spacingS
  }),
  name: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacing2Xs,
    wordWrap: 'break-word'
  }),
  email: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid
  }),
  password: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL
  })
};

const openEditModal = async (user, onEdit) => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <UserEditModal
        user={user}
        onConfirm={onClose}
        onCancel={() => onClose(false)}
        isShown={isShown}
      />
    );
  });

  if (result === false) {
    return;
  }

  onEdit(result);
};

const openChangePasswordModal = async (user, onChangePassword) => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <ChangePasswordModal
        user={user}
        onConfirm={onClose}
        onCancel={() => onClose(false)}
        isShown={isShown}
      />
    );
  });

  if (result === false) {
    return;
  }

  onChangePassword(result);
};

export default function AccountDetails({ user, onEdit, onChangePassword }) {
  const [identities, setIdentities] = useState(user.identities);
  const removeIdentity = identityId => {
    const updatedIdentities = identities.filter(identity => identity.sys.id !== identityId);

    setIdentities(updatedIdentities);
  };

  return (
    <div data-test-id="user-account-data">
      <section className={styles.flexContainer}>
        <div className={cx(styles.column, styles.flexGrow1)}>
          <Heading>Account</Heading>
          <div className={cx(styles.flexContainer, styles.paddingTopS)}>
            <img
              className={styles.accountImage}
              alt={`Profile image for ${user.firstName} ${user.lastName}`}
              src={user.avatarUrl}
            />
            <Typography className={cx(styles.column, styles.typographyContainer)}>
              <span data-test-id="user-full-name" className={styles.name}>
                {user.firstName} {user.lastName}
              </span>
              <span data-test-id="user-email" className={styles.email}>
                {user.email}
                {user.unconfirmedEmail && (
                  <>
                    <br />
                    <span data-test-id="unconfirmed-email">
                      Unconfirmed email: {user.unconfirmedEmail}
                    </span>
                  </>
                )}
              </span>
              {!user.ssoLoginOnly && (
                <TextLink
                  testId="link-change-password"
                  onClick={() => openChangePasswordModal(user, onChangePassword)}>
                  {user.passwordSet && (
                    <span data-test-id="change-password-cta">Change password</span>
                  )}
                  {!user.passwordSet && <span data-test-id="add-password-cta">Add password</span>}
                </TextLink>
              )}
              {user.ssoLoginOnly && (
                <TextLink testId="sso-active" href={websiteUrl('faq/sso')}>
                  Single sign-on is active for your account.
                </TextLink>
              )}
            </Typography>
          </div>
        </div>
        <div className={styles.column}>
          <Tooltip place="bottom" content="Edit account">
            <IconButton
              label="Edit user account details"
              iconProps={{ icon: 'Edit' }}
              buttonType="muted"
              onClick={() => openEditModal(user, onEdit)}
              testId="edit-user-account-details"
            />
          </Tooltip>
        </div>
      </section>
      {!user.ssoLoginOnly && (
        <IdentitiesSection
          userHasPassword={user.passwordSet}
          onRemoveIdentity={removeIdentity}
          identities={identities}
        />
      )}
    </div>
  );
}

AccountDetails.propTypes = {
  user: UserPropType.isRequired,
  onEdit: PropTypes.func.isRequired,
  onChangePassword: PropTypes.func.isRequired
};