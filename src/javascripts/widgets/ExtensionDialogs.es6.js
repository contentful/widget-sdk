import React from 'react';
import { isPlainObject } from 'lodash';
import { Modal, Button, ModalConfirm, TextInput } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';

export async function openAlert(options) {
  validateOptions(options);

  await ModalLauncher.open(({ isShown, onClose }) => (
    <Modal
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnEscapePress={options.shouldCloseOnEscapePress}
      shouldCloseOnOverlayClick={options.shouldCloseOnOverlayClick}>
      {() => (
        <React.Fragment>
          <Modal.Header title={options.title} />
          <Modal.Content>
            <p>{options.message}</p>
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="muted" onClick={onClose}>
              {options.confirmLabel || 'Confirm'}
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  ));

  return true;
}

export async function openConfirm(options) {
  validateOptions(options, {
    additionalStringOptions: ['cancelLabel']
  });

  return ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      isShown={isShown}
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
      title={options.title}
      intent="primary"
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}>
      {options.message}
    </ModalConfirm>
  ));
}

export async function openPrompt(options) {
  validateOptions(options, {
    additionalStringOptions: ['cancelLabel', 'defaultValue']
  });

  return ModalLauncher.open(({ isShown, onClose }) => {
    let value = options.defaultValue || '';

    return (
      <ModalConfirm
        isShown={isShown}
        onConfirm={() => onClose(value)}
        onCancel={() => onClose(false)}
        title={options.title}
        intent="primary"
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}>
        <p>{options.message}</p>
        <TextInput value={value} onChange={e => (value = e.target.value)} />
      </ModalConfirm>
    );
  });
}

// Options come directly from UI Extensions (3rd-party code).
// They are later used for rendering in the main Web App window.
// For this reason we need to validate them strictly as we do
// here. PropTypes wouldn't cut a deal.
function validateOptions(options, config = {}) {
  if (!isPlainObject(options)) {
    throw new Error('No options priovided.');
  }

  // Required options.
  ['title', 'message'].forEach(key => {
    if (!(key in options)) {
      throw new Error(`"${key}" is required.`);
    }
  });

  const additionalStringOptions = Array.isArray(config.additionalStringOptions)
    ? config.additionalStringOptions
    : [];

  // If present, these options must be strings.
  ['title', 'message', 'confirmLabel'].concat(additionalStringOptions).forEach(key => {
    if (key in options && typeof options[key] !== 'string') {
      throw new Error(`"${key}" must be a string.`);
    }
  });

  // If present, these options must be booleans.
  ['shouldCloseOnEscapePress', 'shouldCloseOnOverlayClick'].forEach(key => {
    if (key in options && typeof options[key] !== 'boolean') {
      throw new Error(`"${key}" must be a boolean.`);
    }
  });
}
