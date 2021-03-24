import React, { useState, useCallback, useLayoutEffect, useRef } from 'react';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  ModalConfirm,
  Paragraph,
  Textarea,
  TextLink,
  Notification,
} from '@contentful/forma-36-react-components';
import * as util from '../util';
import { KEY_GEN_GUIDE_URL } from '../DocumentationUrls';

import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

const styles = {
  appName: css({
    fontWeight: 'bold',
  }),
  button: css({
    marginTop: tokens.spacingXl,
    marginRight: tokens.spacingM,
  }),
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
  textarea: css({
    '& textarea': css({
      whiteSpace: 'pre',
      fontFamily: tokens.fontStackMonospace,
      height: '215px',
    }),
  }),
};

function AddKeyForm({ value, setValue }) {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <>
      <Paragraph className={styles.spacer}>
        Paste your public key into the field below. We require a key size of 4096 bit. Learn{' '}
        <TextLink
          target="_blank"
          rel="noreferrer noopener"
          href={withInAppHelpUtmParams(KEY_GEN_GUIDE_URL)}>
          how to generate a key pair
        </TextLink>
        .
      </Paragraph>

      <Textarea
        className={styles.textarea}
        textareaRef={textareaRef}
        value={value}
        placeholder="-----BEGIN PUBLIC KEY-----"
        onInput={(e) => setValue(e.target.value)}
      />
    </>
  );
}

AddKeyForm.propTypes = {
  value: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
};

export function AddKeyDialog({ onConfirm, isShown, onCancel }) {
  const [value, setValue] = useState('');
  const [isLoading, setLoading] = useState(false);

  const onConfirmHandler = useCallback(async () => {
    setLoading(true);

    let base64Der;
    let base64Fingerprint;

    try {
      base64Der = util.keyPemTobase64Der(value);
      const fingerprint = await util.getSha256FromBase64(base64Der);
      base64Fingerprint = window
        .btoa(fingerprint)
        .toString('base64')
        .replace(/\+/g, '-') // Convert '+' to '-'
        .replace(/\//g, '_') // Convert '/' to '_'
        .replace(/=+$/, ''); // Remove ending '='
    } catch {
      Notification.error("This doesn't appear to be a valid public key.");
      setLoading(false);
      return;
    }

    const jwk = {
      alg: 'RS256',
      kty: 'RSA',
      use: 'sig',
      x5c: [base64Der],
      kid: base64Fingerprint,
      x5t: base64Fingerprint,
    };

    onConfirm(jwk).finally(() => {
      setLoading(false);
    });
  }, [onConfirm, value]);

  return (
    <ModalConfirm
      title="Add public key"
      isShown={isShown}
      intent="positive"
      isConfirmLoading={isLoading}
      isConfirmDisabled={isLoading}
      confirmLabel="Add key"
      cancelLabel="Cancel"
      confirmTestId="add-key-confirm"
      cancelTestId="add-key-cancel"
      onCancel={onCancel}
      onConfirm={onConfirmHandler}>
      <AddKeyForm value={value} setValue={setValue} />
    </ModalConfirm>
  );
}

AddKeyDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
