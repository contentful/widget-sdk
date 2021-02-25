import React from 'react';
import PropTypes from 'prop-types';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { Button, Paragraph, Modal } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const styles = {
  paragraph: css({
    paddingBottom: '10px',
  }),
};

export function StartAppTrialModal({ onConfirm, isShown, onClose }) {
  const handleOnConfirm = () => {
    trackEvent(EVENTS.APP_TRIAL_START)();
    onConfirm();
    onClose();
  };

  return (
    <Modal
      position="center"
      isShown={isShown}
      title={`Compose + Launch free trial`}
      onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Paragraph element="p" className={styles.paragraph}>
              This trial will give you free access to Compose + Launch for 10 days. You can test
              both apps in a new trial space with example content, or you can add some of your own.
              No payment is required, and the trial won&apos;t affect your exisiting spaces or
              content in any way.
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={handleOnConfirm} testId="confirm-button">
              Start your free trial
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

StartAppTrialModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
