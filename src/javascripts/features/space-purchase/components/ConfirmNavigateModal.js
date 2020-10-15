import React from 'react';
import PropTypes from 'prop-types';

import { Button, Modal } from '@contentful/forma-36-react-components';

export function ConfirmNavigateModal({ isShown, onClose, withTemplate = false }) {
  return (
    <Modal
      position="center"
      isShown={isShown}
      testId="confirm-navigate-modal"
      title="Are you sure?"
      onClose={() => onClose(false)}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            Are you sure you want to leave this page? Your space may not be created{' '}
            {withTemplate && 'and you may have issues with your template'}.
          </Modal.Content>
          <Modal.Controls>
            <Button
              onClick={() => onClose(true)}
              buttonType="negative"
              testId="confirm-navigate-modal.confirm">
              Confirm
            </Button>
            <Button
              onClick={() => onClose(false)}
              testId="confirm-navigate-modal.cancel"
              buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

ConfirmNavigateModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  withTemplate: PropTypes.bool,
};
