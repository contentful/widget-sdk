import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { ModalConfirm, TextInput, Paragraph, Note } from '@contentful/forma-36-react-components';

const styles = {
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
};

function DeleteContentTypeForm(props) {
  const textInputRef = useRef(null);

  useLayoutEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  return (
    <React.Fragment>
      <Paragraph className={styles.spacer}>
        You are about to delete the content type <strong>{props.contentTypeName}</strong>. The
        applications, websites or other API clients might expect this content type to exist, so they
        might break after the content type is gone.
      </Paragraph>

      <Paragraph className={styles.spacer}>
        To confirm, type the name of the content type in the field below:
      </Paragraph>
      <TextInput
        testId="delete-content-type-repeat-input"
        className={styles.spacer}
        inputRef={textInputRef}
        value={props.value}
        onChange={(e) => {
          props.setValue(e.target.value);
        }}
      />
      <Note>Note that the content type can’t be restored once it’s deleted.</Note>
    </React.Fragment>
  );
}

DeleteContentTypeForm.propTypes = {
  value: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
  contentTypeName: PropTypes.string.isRequired,
};

export default function DeleteContentTypeDialog(props) {
  const [value, setValue] = useState('');
  const [isLoading, setLoading] = useState(false);

  const onConfirmHandler = useCallback(() => {
    setLoading(true);
    props.onConfirm().finally(() => {
      setLoading(false);
    });
  }, [props, setLoading]);

  return (
    <ModalConfirm
      title="Delete content type"
      isShown={props.isShown}
      intent="negative"
      isConfirmLoading={isLoading}
      isConfirmDisabled={value !== props.contentTypeName}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      confirmTestId="delete-content-type-confirm"
      cancelTestId="delete-content-type-cancel"
      onCancel={props.onCancel}
      onConfirm={onConfirmHandler}>
      <DeleteContentTypeForm
        value={value}
        setValue={setValue}
        contentTypeName={props.contentTypeName}
      />
    </ModalConfirm>
  );
}
DeleteContentTypeDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  contentTypeName: PropTypes.string.isRequired,
};
