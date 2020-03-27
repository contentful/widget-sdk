import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from '@contentful/forma-36-react-components';

export default function SaveConfirmModal({ onConfirm, name, isShown, onClose }) {
  return (
    <Modal position="center" isShown={isShown} title={`Update ${name}`} onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            Are you sure you want to update the {name} app definition? This will have an effect on
            all of its installations.
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onConfirm} buttonType="primary" testId="confirm-button">
              Update
            </Button>
            <Button onClick={onClose} buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

SaveConfirmModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
};
