import React, { useState, useCallback } from 'react';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

const styles = {
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
};

export default function RevokeKeyDialog({ onConfirm, isShown, onCancel }) {
  const [isLoading, setLoading] = useState(false);

  const onConfirmHandler = useCallback(async () => {
    setLoading(true);

    onConfirm().finally(() => {
      setLoading(false);
    });
  }, [onConfirm]);

  return (
    <ModalConfirm
      title="Revoke public key"
      isShown={isShown}
      intent="negative"
      isConfirmLoading={isLoading}
      isConfirmDisabled={isLoading}
      confirmLabel="Revoke"
      cancelLabel="Cancel"
      confirmTestId="revoke-key-confirm"
      cancelTestId="revoke-key-cancel"
      onCancel={onCancel}
      onConfirm={onConfirmHandler}>
      <Paragraph className={styles.spacer}>
        Are you sure you want to revoke this public key from the app? You will no longer be able to
        sign tokens with this key.
      </Paragraph>
    </ModalConfirm>
  );
}

RevokeKeyDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
