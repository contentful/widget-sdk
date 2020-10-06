import React, { useState, useCallback } from 'react';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

const styles = {
  spacer: css({
    marginBottom: tokens.spacingM,
  }),
};

export function DeleteKeyDialog({ onConfirm, isShown, onCancel }) {
  const [isLoading, setLoading] = useState(false);

  const onConfirmHandler = useCallback(async () => {
    setLoading(true);

    onConfirm().finally(() => {
      setLoading(false);
    });
  }, [onConfirm]);

  return (
    <ModalConfirm
      title="Delete public key"
      isShown={isShown}
      intent="negative"
      isConfirmLoading={isLoading}
      isConfirmDisabled={isLoading}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      confirmTestId="revoke-key-confirm"
      cancelTestId="revoke-key-cancel"
      onCancel={onCancel}
      onConfirm={onConfirmHandler}>
      <Paragraph className={styles.spacer}>
        After deleting a key pair, your app will no longer be able to generate tokens with the
        private key associated to this key pair.
      </Paragraph>

      <Paragraph>Are you sure you want to delete this public key from your app?</Paragraph>
    </ModalConfirm>
  );
}

DeleteKeyDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
