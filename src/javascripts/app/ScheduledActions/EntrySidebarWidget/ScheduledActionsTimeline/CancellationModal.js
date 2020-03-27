import React from 'react';
import { Modal, Button } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

const CancellationModal = ({ onConfirm, onClose, isShown, children }) => (
  <Modal isShown={isShown} onClose={onClose} testId="job-cancellation-modal">
    {({ onClose }) => (
      <React.Fragment>
        <Modal.Header title="Cancel Schedule?" onClose={onClose} />
        <Modal.Content>{children}</Modal.Content>
        <Modal.Controls>
          <Button data-test-id="confirm-job-cancellation" onClick={onConfirm} buttonType="negative">
            Cancel the schedule
          </Button>
          <Button onClick={onClose} buttonType="muted">
            Close
          </Button>
        </Modal.Controls>
      </React.Fragment>
    )}
  </Modal>
);

CancellationModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default CancellationModal;
