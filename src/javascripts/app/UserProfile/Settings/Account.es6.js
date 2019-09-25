import React, { useState, useCallback } from 'react';
import {
  Heading,
  IconButton,
  Typography,
  Tooltip,
  TextLink
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import { websiteUrl } from 'Config.es6';
import { User as UserPropType } from './propTypes';
import IdentitiesSection from './IdentitiesSection.es6';
import UserEditModal from './UserEditModal';
import AddPasswordModal from './AddPasswordModal';
import * as ModalLauncher from 'app/common/ModalLauncher.es6';
import { deleteUserIdentityData } from './AccountService.es6';

const styles = {
  spaceLeft: css({
    marginLeft: tokens.spacingXs,
    cursor: 'pointer'
  }),
  paddingS: css({ padding: tokens.spacingS }),
  accountImage: css({
    height: '68px',
    width: '68px',
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
  paddingLeftL: css({
    paddingLeft: tokens.spacingL
  }),
  paddingTopS: css({
    paddingTop: tokens.spacingS
  }),
  name: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacing2Xs
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

const openEditModal = async (user, setUser) => {
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

  const updatedUser = Object.assign({}, user, result);

  setUser(updatedUser);
};

const openAddPasswordModal = async (user, setUser) => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <AddPasswordModal
        currentVersion={user.sys.version}
        onConfirm={onClose}
        onCancel={() => onClose(false)}
        isShown={isShown}
      />
    );
  });

  if (result === false) {
    return;
  }

  const updatedUser = Object.assign({}, user, result);

  setUser(updatedUser);
};

export default function AccountDetails({ data }) {
  const [user, setUser] = useState(data);
  const [identities, setIdentities] = useState(user.identities);
  const removeIdentity = useCallback(
    async provider => {
      const {
        sys: { id: identityId }
      } = identities.find(i => i.provider === provider);

      // identityIds are, weirdly, numbers, so they must be cast to string before making
      // the API call
      await deleteUserIdentityData(identityId.toString());

      const updatedIdentities = identities.filter(identity => {
        return identity.provider !== provider;
      });

      setIdentities(updatedIdentities);
    },
    [identities]
  );

  return (
    <div data-test-id="user-account-data" className={styles.paddingS}>
      <section className={styles.flexContainer}>
        <div className={cx(styles.column, styles.flexGrow1)}>
          <Heading>Account</Heading>
          <div className={cx(styles.flexContainer, styles.paddingTopS)}>
            <img
              className={styles.accountImage}
              alt={`Profile image for ${user.firstName} ${user.lastName}`}
              src={user.avatarUrl}
            />
            <Typography className={cx(styles.column, styles.paddingLeftL)}>
              <span className={styles.name}>
                {user.firstName} {user.lastName}
              </span>
              <span className={styles.email}>
                {user.email}{' '}
                {user.unconfirmedEmail ? (
                  <Tooltip content="This email is unconfirmed">({user.unconfirmedEmail})</Tooltip>
                ) : null}
              </span>
              {!user.ssoLoginOnly && user.passwordSet && (
                <span className={styles.password}>********</span>
              )}
              {!user.ssoLoginOnly && !user.passwordSet && (
                <TextLink onClick={() => openAddPasswordModal(user, setUser)}>
                  Add a password
                </TextLink>
              )}
              {user.ssoLoginOnly && (
                <TextLink href={websiteUrl('faq/sso')}>
                  Single sign-on is active for your account.
                </TextLink>
              )}
            </Typography>
          </div>
        </div>
        <div className={styles.column}>
          <Tooltip place="bottom" id="edit-user-account" content="Edit account">
            <IconButton
              label="Edit user account details"
              iconProps={{ icon: 'Edit' }}
              buttonType="muted"
              onClick={() => openEditModal(user, setUser)}
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
  data: UserPropType.isRequired
};
