import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Subheading,
  Paragraph,
  Button,
  TextLink,
  Typography,
  Notification,
  ModalConfirm,
} from '@contentful/forma-36-react-components';
import { authUrl } from 'Config';
import $window from 'utils/ngCompat/window';
import { joinWithAnd } from 'utils/StringUtils';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { useAsyncFn } from 'core/hooks';
import { websiteUrl } from 'Config';
import { getUserTotp, deleteUserTotp } from './AccountRepository';
import ChangePasswordModal from './ChangePasswordModal';
import Enable2FAModal from './Enable2FAModal';
import { User as UserPropType } from './propTypes';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const goToResendEmailPage = () => {
  $window.location = authUrl('/confirmation/new/resend');
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'user-profile-security',
  campaign: 'in-app-help',
});

const openEnable2FAModal = async (onEnable2FA) => {
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

const openDisable2FAModal = async (onDisable2FA) => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <ModalConfirm
        isShown={isShown}
        intent="negative"
        onConfirm={() => onClose(true)}
        confirmTestId="confirm-disable-2fa-button"
        onCancel={() => onClose(false)}
        confirmLabel="Disable">
        <Typography>
          <Paragraph>
            By disabling two-factor authentication your account will be less secure. Are you sure
            you want to disable two-factor authentication on your account?
          </Paragraph>
          <Paragraph>
            You will not be asked about your second authentication factor anymore and will be able
            to login with your password.
          </Paragraph>
        </Typography>
      </ModalConfirm>
    );
  });

  if (result === false) {
    return;
  }

  try {
    await deleteUserTotp();
  } catch (e) {
    Notification.error('Something went wrong while disabling your 2FA');
    return;
  }
  onDisable2FA();
  Notification.success('You successfully disabled 2FA on your account');
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

const TwoFactorAuthenticationFaqLink = () => (
  <TextLink
    href={withInAppHelpUtmParams(websiteUrl('faq/two-factor-authentication/'))}
    target="_blank">
    Learn more about 2FA
  </TextLink>
);

export default function SecuritySection({ user, onAddPassword, onEnable2FA, onDisable2FA }) {
  const [{ isLoading: loadingTotp }, getTotp] = useAsyncFn(
    useCallback(() => openEnable2FAModal(onEnable2FA), [onEnable2FA])
  );

  const {
    passwordSet,
    confirmed: confirmedEmail,
    mfaEligible: eligible,
    mfaEnabled: enabled,
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
        <>
          <Paragraph>
            Add an extra layer of security to your account by using a one-time security code. Each
            time you sign into your Contentful account, you’ll need your password and your security
            code.
          </Paragraph>
          <Paragraph>
            <TwoFactorAuthenticationFaqLink />
          </Paragraph>
        </>
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
      {enabled && (
        <>
          <Paragraph>Enabled with authenticator app</Paragraph>
          <Paragraph>
            <TwoFactorAuthenticationFaqLink />
          </Paragraph>
          <Button
            testId="delete-2fa-cta"
            buttonType="negative"
            onClick={() => openDisable2FAModal(onDisable2FA)}>
            Disable
          </Button>
        </>
      )}
    </Typography>
  );
}

SecuritySection.propTypes = {
  onAddPassword: PropTypes.func.isRequired,
  onEnable2FA: PropTypes.func.isRequired,
  user: UserPropType.isRequired,
  onDisable2FA: PropTypes.func.isRequired,
};
