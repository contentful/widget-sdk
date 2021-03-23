import React, { Dispatch, SetStateAction, useState } from 'react';
import { css } from 'emotion';
import {
  Heading,
  IconButton,
  Tooltip,
  TextLink,
  ModalLauncher,
  Card,
  Flex,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { websiteUrl } from 'Config';

import { IdentitiesSection } from './IdentitiesSection';
import { UserEditModal } from './UserEditModal';
import { ChangePasswordModal } from './ChangePasswordModal';

import type { UserData, Identity } from '../types';

const styles = {
  accountImage: css({
    height: '75px',
    width: '75px',
    marginRight: tokens.spacingM,
    borderRadius: '50%',
  }),
  name: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacing2Xs,
    wordWrap: 'break-word',
  }),
  email: css({
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid,
  }),
  password: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL,
  }),
};

const openEditModal = async (user: UserData, onEdit) => {
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

interface AccountDetailsProps {
  user: UserData;
  onEdit: Dispatch<SetStateAction<UserData | undefined>>;
  onChangePassword: Dispatch<SetStateAction<UserData | undefined>>;
}

export function AccountDetails({ user, onEdit, onChangePassword }: AccountDetailsProps) {
  const [identities, setIdentities] = useState<Identity[]>(user.identities);

  const removeIdentity = (identityId: Identity['sys']['id']) => {
    const updatedIdentities = identities.filter((identity) => identity.sys.id !== identityId);

    setIdentities(updatedIdentities);
  };

  return (
    <Card testId="account-details-section-card" padding="large">
      <Flex justifyContent="space-between" alignItems="flex-start" marginBottom="spacingL">
        <Flex flexDirection="column">
          <Heading>Account</Heading>

          <Flex marginTop="spacingM">
            <img
              className={styles.accountImage}
              alt={`Profile image for ${user.firstName} ${user.lastName}`}
              src={user.avatarUrl}
            />

            <Flex flexDirection="column">
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
            </Flex>
          </Flex>
        </Flex>

        <Tooltip place="bottom" content="Edit account">
          <IconButton
            label="Edit user account details"
            iconProps={{ icon: 'Edit' }}
            buttonType="muted"
            onClick={() => openEditModal(user, onEdit)}
            testId="edit-user-account-details"
          />
        </Tooltip>
      </Flex>
      {!user.ssoLoginOnly && (
        <IdentitiesSection
          userHasPassword={user.passwordSet}
          onRemoveIdentity={removeIdentity}
          identities={identities}
        />
      )}
    </Card>
  );
}
