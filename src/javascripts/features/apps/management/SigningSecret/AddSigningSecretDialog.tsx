import React, { useState } from 'react';
import {
  Paragraph,
  TextLink,
  TextInput,
} from '@contentful/forma-36-react-components';
import { ModalConfirm, } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import RandExp from 'randexp';

// generate a random 64-length string from a RegExp
const randomStringRegExp = new RandExp(/[A-Za-z0-9-_]/);
const generateSecret = () => Array(64).fill('').map(_ => randomStringRegExp.gen()).join('');

const styles = {
  secretInput: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingXs,
  })
}

export const AddSigningSecretDialog = ({ secret, isShown, onClose, saveUpdatedSecret}) => {
  const [updatedSecret, setUpdatedSecret] = useState(secret || generateSecret());
   
   return <>
    <ModalConfirm
      title="Update shared secret"
      isShown={isShown}
      isConfirmDisabled={(updatedSecret === secret)}
      intent="positive"
      confirmLabel="Update"
      cancelLabel="Cancel"
      confirmTestId="add-secret-btn"
      cancelTestId="add-secret-cancel"
      onCancel={onClose}
      onConfirm={() => {saveUpdatedSecret(updatedSecret); onClose()}}
    >
      <Paragraph>You are about to update the shared secret of this app definition. This will invalidate your current secret. Make sure to update your app's code to reflect this change</Paragraph>
      <TextInput
        placeholder={"Click on Regenerate secret below to create a secret"}
        className={styles.secretInput}
        value={updatedSecret}
        withCopyButton
      />
      <TextLink onClick={() => setUpdatedSecret(generateSecret())}>Regenerate Secret</TextLink>
    </ModalConfirm>
  </>
}
