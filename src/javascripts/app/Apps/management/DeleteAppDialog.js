import React, { useState, useCallback, useLayoutEffect, useRef } from 'react';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Note, ModalConfirm, Paragraph, TextInput } from '@contentful/forma-36-react-components';

const styles = {
  appName: css({
    fontWeight: 'bold'
  }),
  button: css({
    marginTop: tokens.spacingXl,
    marginRight: tokens.spacingM
  }),
  spacer: css({
    marginBottom: tokens.spacingL
  })
};

function DeleteAppForm({ appName, value, setValue }) {
  const textInputRef = useRef(null);

  useLayoutEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  return (
    <>
      <Paragraph className={styles.spacer}>
        You are about to delete the <strong>{appName}</strong>. This will also delete all existing
        installations of this app in your spaces. Spaces in this organization might expect this app
        to exist, so they might break after the app is gone.
      </Paragraph>

      <Paragraph className={styles.spacer}>
        To confirm, type the name of the app in the field below.
      </Paragraph>

      <TextInput
        className={styles.spacer}
        inputRef={textInputRef}
        value={value}
        type="text"
        onInput={e => setValue(e.target.value)}
      />

      <Note>Note that the app can&apos;t be restored once it&apos;s deleted.</Note>
    </>
  );
}

DeleteAppForm.propTypes = {
  value: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
  appName: PropTypes.string.isRequired
};

export default function DeleteAppDialog({ onConfirm, appName, isShown, onCancel }) {
  const [value, setValue] = useState('');
  const [isLoading, setLoading] = useState(false);

  const onConfirmHandler = useCallback(() => {
    setLoading(true);
    onConfirm().finally(() => {
      setLoading(false);
    });
  }, [onConfirm]);

  return (
    <ModalConfirm
      title="Delete app"
      isShown={isShown}
      intent="negative"
      isConfirmLoading={isLoading}
      isConfirmDisabled={value !== appName}
      confirmLabel="Delete app"
      cancelLabel="Cancel"
      confirmTestId="delete-app-confirm"
      cancelTestId="delete-app-cancel"
      onCancel={onCancel}
      onConfirm={onConfirmHandler}>
      <DeleteAppForm value={value} setValue={setValue} appName={appName} />
    </ModalConfirm>
  );
}

DeleteAppDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  appName: PropTypes.string.isRequired
};
