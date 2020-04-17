import React, { useState, useRef, useEffect } from 'react';
import { ModalLauncher } from 'core/components/ModalLauncher';
import {
  ModalConfirm,
  TextInput,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

export function openInputDialog(params, initialValue = '') {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <InputDialog
      isShown={isShown}
      params={params}
      initialValue={initialValue}
      onConfirm={(value) => {
        const trimmedValue = String(value).trim();
        if (trimmedValue) {
          onClose(trimmedValue);
        }
      }}
      onCancel={() => {
        onClose(false);
      }}
    />
  ));
}

export default function InputDialog(props) {
  const [value, setValue] = useState(props.initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef && inputRef.current && inputRef.current.focus) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <ModalConfirm
      title={props.params.title}
      confirmLabel={props.params.confirmLabel}
      cancelLabel={props.params.cancelLabel}
      isShown={props.isShown}
      intent={props.params.intent}
      isConfirmDisabled={!props.params.isValid(value)}
      onCancel={() => {
        props.onCancel();
      }}
      onConfirm={() => {
        props.onConfirm(value);
      }}>
      <Typography>
        <Paragraph>{props.params.message}</Paragraph>
      </Typography>
      <TextInput
        ref={inputRef}
        maxLength={props.params.maxLength ? props.params.maxLength : 255}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </ModalConfirm>
  );
}

InputDialog.propTypes = {
  params: PropTypes.shape({
    message: PropTypes.string,
    title: PropTypes.string,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    intent: PropTypes.string,
    maxLength: PropTypes.number,
    isValid: PropTypes.func.isRequired,
  }).isRequired,
  isShown: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialValue: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
