import React, { useState } from 'react';
import { Paragraph, TextLink, TextInput } from '@contentful/forma-36-react-components';
import { ModalConfirm } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { generateSecret } from './utils';

const styles = {
  secretInput: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingXs,
    '& input': {
      fontFamily: tokens.fontStackMonospace,
    },
  }),
};

export const AddSigningSecretDialog = ({ isShown, onClose, saveUpdatedSecret }) => {
  const [updatedSecret, setUpdatedSecret] = useState(generateSecret());

  return (
    <>
      <ModalConfirm
        title="Update shared secret"
        isShown={isShown}
        intent="positive"
        confirmLabel="Update"
        cancelLabel="Cancel"
        confirmTestId="add-secret-btn"
        cancelTestId="add-secret-cancel"
        size={'large'}
        onCancel={onClose}
        onConfirm={() => {
          saveUpdatedSecret(updatedSecret);
          onClose();
        }}>
        <Paragraph>
          You are about to update the shared secret of this app definition. This will invalidate
          your current secret. Make sure to update your app&apos;s code to reflect this change
        </Paragraph>
        <TextInput
          placeholder={'Click on Regenerate secret below to create a secret'}
          className={styles.secretInput}
          value={updatedSecret}
          withCopyButton
        />
        <TextLink onClick={() => setUpdatedSecret(generateSecret())}>Regenerate Secret</TextLink>
      </ModalConfirm>
    </>
  );
};
