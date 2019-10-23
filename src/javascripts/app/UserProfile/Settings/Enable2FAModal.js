import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Modal,
  Button,
  Paragraph,
  TextField,
  Typography,
  Notification
} from '@contentful/forma-36-react-components';
import * as tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { enableTotp } from './AccountRepository';
import { createQRCodeDataURI } from './utils';

const styles = {
  qrcode: css({
    textAlign: 'center'
  }),
  secret: css({
    textAlign: 'center',
    fontWeight: tokens.fontWeightDemiBold
  }),
  controlsPanel: css({
    marginTop: tokens.spacingM,
    display: 'flex'
  }),
  marginRightM: css({
    marginRight: tokens.spacingM
  })
};

export default function Enable2FAModal({ totp, onCancel, onConfirm, isShown }) {
  const [code, setCode] = useState('');
  const [isCodeInvalid, setInvalidCode] = useState(false);
  const [pending, setPending] = useState(false);

  const confirm2FACode = async () => {
    setPending(true);
    setInvalidCode(false);

    try {
      await enableTotp(code);
    } catch (e) {
      setInvalidCode(true);
      return;
    } finally {
      setPending(false);
    }

    onConfirm();
    Notification.success('2FA successfully enabled for your account');
  };

  const dataUri = createQRCodeDataURI(totp.provisioningUri);

  return (
    <Modal
      isShown={isShown}
      title="Enable 2FA"
      onClose={() => {
        setInvalidCode(false);
        onCancel();
      }}>
      <Typography>
        <Paragraph>
          First, download an authenticator app such as Google Authenticator, Authy, or Duo Mobile
          onto your device.
        </Paragraph>
        <Paragraph>Then, scan this QR code with the authenticator app on your device.</Paragraph>
        <div className={styles.qrcode}>
          <img data-test-id="qrcode" alt="QR code for two factor authentication" src={dataUri} />
        </div>
        <Paragraph>
          If you can’t scan this code, copy or type the following code manually into your
          authenticator app:
        </Paragraph>
        <Paragraph className={styles.secret}>{totp.secret}</Paragraph>
        <Paragraph>
          Finally, enter the code from your app below, and click Enable to finish setting up your
          2FA.
        </Paragraph>
        <Form onSubmit={confirm2FACode}>
          <TextField
            required
            testId="code-input"
            id="code"
            name="code"
            value={code}
            onChange={e => setCode(e.target.value)}
            labelText="Code"
            validationMessage={isCodeInvalid ? 'The code you entered is not correct' : ''}
            textInputProps={{
              type: 'text',
              autoComplete: 'off',
              maxLength: 6
            }}
          />
          <div className={styles.controlsPanel}>
            <Button
              className={styles.marginRightM}
              disabled={pending}
              loading={pending}
              testId="submit"
              buttonType="positive"
              onClick={confirm2FACode}>
              Enable
            </Button>
            <Button
              buttonType="muted"
              disabled={pending}
              testId="cancel"
              onClick={() => {
                setInvalidCode(false);
                onCancel();
              }}>
              Cancel
            </Button>
          </div>
        </Form>
      </Typography>
    </Modal>
  );
}

Enable2FAModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  totp: PropTypes.object.isRequired
};
