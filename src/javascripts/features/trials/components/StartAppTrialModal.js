import React from 'react';
import PropTypes from 'prop-types';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { Button, Paragraph, Modal, TextLink } from '@contentful/forma-36-react-components';
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
      title={`Start your free Contentful Apps Trial`}
      onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Paragraph element="p" className={styles.paragraph}>
              This trial will give you free access to Compose and Launch for 10 days. You can
              experience both apps hassle-free in a new trial space. Starting a trial will have no
              impact on your existing spaces.
            </Paragraph>
            <Paragraph element="p">
              <TextLink
                href="https://www.contentful.com/help/contentful-apps-trial/"
                target="_blank"
                rel="noopener noreferrer">
                Learn more
              </TextLink>{' '}
              about Contentful Apps Trial.
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={handleOnConfirm} testId="confirm-button">
              Start trial now
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
