import React from 'react';
import PropTypes from 'prop-types';
import { ModalLauncher } from 'core/components/ModalLauncher';
import {
  Modal,
  Typography,
  Paragraph,
  Button,
  Note,
  ModalConfirm,
} from '@contentful/forma-36-react-components';

export function openActivationEmailResendDialog({ doResendEmail }) {
  const key = 'activation-email' + Date.now();
  return ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <ActivationEmailResendDialog
        key={key}
        isShown={isShown}
        onClose={() => onClose(false)}
        onSuccess={() => onClose(true)}
        doResendEmail={doResendEmail}
      />
    );
  });
}

export function openConfirmationEmailSentDialog({ email }) {
  return ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <ModalConfirm
        isShown={isShown}
        title="It’s on its way!"
        confirmLabel="OK"
        cancelLabel={null}
        onConfirm={onClose}
        onCancel={onClose}>
        <Paragraph>
          We’ve sent a confirmation email to <strong>{email}</strong>. Click the link in the email
          to confirm your email address.
        </Paragraph>
      </ModalConfirm>
    );
  });
}

export function ActivationEmailResendDialog({ onClose, onSuccess, doResendEmail, isShown }) {
  const [wasUnableToSend, setWasUnableToSend] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  return (
    <Modal
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}>
      {() => (
        <React.Fragment>
          <Modal.Header title="Confirm your email address" />
          <Modal.Content>
            <Typography>
              <Paragraph>
                <strong>
                  Confirming your email ensures that we can send you reset instructions in case you
                  forget your password.
                </strong>
              </Paragraph>
              <Paragraph>
                We previously sent you a confirmation email when you signed up. If you didn’t
                receive it or deleted it by accident, just hit the resend button below.
              </Paragraph>
            </Typography>
            {wasUnableToSend && (
              <Note noteType="negative">
                We couldn’t resend the confirmation email. Try again or contact us if you keep
                getting an error.
              </Note>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} buttonType="positive" disabled={isSending}>
              Ok, got it
            </Button>
            <Button
              onClick={() => {
                setIsSending(true);
                doResendEmail()
                  .then(() => {
                    setIsSending(false);
                    onSuccess();
                  })
                  .catch(() => {
                    setIsSending(false);
                    setWasUnableToSend(true);
                  });
              }}
              disabled={isSending}
              loading={isSending}
              buttonType="muted">
              {isSending ? 'Sending...' : 'Resend email'}
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
}

ActivationEmailResendDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  doResendEmail: PropTypes.func.isRequired,
};
