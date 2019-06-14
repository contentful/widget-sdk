import React from 'react';
import { Modal, Button } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

const CancellationModal = ({ onConfirm, onClose, isShown }) => (
  <Modal isShown={isShown} onClose={onClose} testId="job-cancellation-modal">
    {({ onClose }) => (
      <React.Fragment>
        <Modal.Header title="Cancel Schedule?" onClose={onClose} />
        <Modal.Content>Are you sure you want to cancel the schedule for this entry? </Modal.Content>
        <Modal.Controls>
          <Button onClick={onConfirm} buttonType="positive">
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
  isShown: PropTypes.bool.isRequired
};

export default CancellationModal;
