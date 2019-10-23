import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Subheading,
  Paragraph,
  Button,
  Typography,
  Notification
} from '@contentful/forma-36-react-components';
import { authUrl } from 'Config.es6';
import $window from 'utils/ngCompat/window.es6';
import { joinWithAnd } from 'utils/StringUtils.es6';
import * as ModalLauncher from 'app/common/ModalLauncher.es6';
import { useAsyncFn } from 'app/common/hooks/useAsync.es6';
import { getUserTotp } from './AccountRepository';
import ChangePasswordModal from './ChangePasswordModal';
import Enable2FAModal from './Enable2FAModal';
import { User as UserPropType } from './propTypes';

const goToResendEmailPage = () => {
  $window.location = authUrl('/confirmation/new/resend');
};

const openEnable2FAModal = async onEnable2FA => {
  let totpData;
  const uniqueModalKey = Date.now();

  try {
    totpData = await getUserTotp();
  } catch (e) {
    Notification.error('Something went wrong while loading your 2FA details');
    return;
  }

  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <Enable2FAModal
        key={uniqueModalKey}
        totp={totpData}
        isShown={isShown}
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}
      />
    );
  });

  if (result === false) {
    return;
  }

  onEnable2FA();
};

const openAddPasswordModal = async (user, onAddPassword) => {
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

  onAddPassword(result);
};

export default function SecuritySection({ user, onAddPassword, onEnable2FA }) {
  const [{ isLoading: loadingTotp }, getTotp] = useAsyncFn(
    useCallback(() => openEnable2FAModal(onEnable2FA), [onEnable2FA])
  );

  const {
    passwordSet,
    confirmed: confirmedEmail,
    mfaEligible: eligible,
    mfaEnabled: enabled
  } = user;

  const reasons = [];

  if (!confirmedEmail) {
    reasons.push('confirm your email');
  }

  if (!passwordSet) {
    reasons.push('add a password');
  }

  const eligibilityCopy = joinWithAnd(reasons);

  return (
    <Typography testId="security-section">
      <Heading>Security</Heading>
      <Subheading>Two-factor authentication (2FA) </Subheading>
      {!enabled && (
        <Paragraph>
          Add an extra layer of security to your account by using a one-time security code. Each
          time you sign into your Contentful account, you’ll need your password and your security
          code.
        </Paragraph>
      )}
      {!enabled && !eligible && (
        <>
          <Paragraph>To enable two-factor authentication please {eligibilityCopy}.</Paragraph>
          {!confirmedEmail ? (
            <Button testId="resend-email-cta" onClick={goToResendEmailPage}>
              Resend confirmation email
            </Button>
          ) : (
            <Button
              testId="add-password-cta"
              onClick={() => openAddPasswordModal(user, onAddPassword)}>
              Add a password
            </Button>
          )}
        </>
      )}
      {!enabled && eligible && (
        <Button testId="enable-2fa-cta" loading={loadingTotp} onClick={getTotp}>
          Enable 2FA
        </Button>
      )}
      {enabled && <Paragraph>Enabled with authenticator app</Paragraph>}
    </Typography>
  );
}

SecuritySection.propTypes = {
  onAddPassword: PropTypes.func.isRequired,
  onEnable2FA: PropTypes.func.isRequired,
  user: UserPropType.isRequired
};
