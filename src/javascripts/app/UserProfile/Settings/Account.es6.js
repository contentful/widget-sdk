import React, { useState, useCallback } from 'react';
import { Heading, IconButton, Typography, Tooltip } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import { User as UserPropType } from './propTypes';
import IdentitiesSection from './IdentitiesSection.es6';
import UserEditModal from './UserEditModal';
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
    color: tokens.colorTextMid
  }),
  password: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL,
    marginTop: tokens.spacingM
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
    // The modal was closed, do nothing
    return;
  }

  // Update the user
  // Set the updated email as the unconfirmed email
  const updatedUser = Object.assign({}, user, {
    ...result,
    email: user.email,
    unconfirmedEmail: result.email
  });

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
              <span className={styles.name}>{user.firstName}</span>
              <span className={styles.name}>{user.lastName}</span>
              <span className={styles.email}>
                {user.email} {user.unconfirmedEmail ? `(${user.unconfirmedEmail})` : null}
              </span>
              <span className={styles.password}>********</span>
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
      <IdentitiesSection onRemoveIdentity={removeIdentity} identities={identities} />
    </div>
  );
}

AccountDetails.propTypes = {
  data: UserPropType.isRequired
};
