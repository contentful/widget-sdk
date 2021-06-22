import React from 'react';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { Button, Paragraph, Modal } from '@contentful/forma-36-react-components';
import { FLAGS, useFeatureFlag } from 'core/feature-flags';
import { css } from 'emotion';

const styles = {
  paragraph: css({
    paddingBottom: '10px',
  }),
};

interface StartAppTrialModalProps {
  isShown: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function StartAppTrialModal({ onConfirm, isShown, onClose }: StartAppTrialModalProps) {
  const [isExtendedTrial] = useFeatureFlag(FLAGS.APPS_TRIAL_DURATION);
  const TRIAL_DURATION = isExtendedTrial ? '60 days' : '10 days';

  const handleOnConfirm = () => {
    trackEvent(EVENTS.START_APP_TRIAL_MODAL, { elementId: 'confirm_button' });
    onConfirm();
    onClose();
  };

  const handleOnClose = () => {
    trackEvent(EVENTS.START_APP_TRIAL_MODAL, { elementId: 'cancel_button' });
    onClose();
  };

  return (
    <Modal
      position="center"
      isShown={isShown}
      title="Compose + Launch free trial"
      onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Paragraph element="p" className={styles.paragraph}>
              This trial will give you free access to Compose + Launch for {TRIAL_DURATION}. You’ll
              get both apps in a new trial space where you can use our example content or create
              your own. No payment is required, and the trial wonʼt affect your exisiting spaces or
              content in any way.
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={handleOnConfirm} testId="confirm-button">
              Start your free trial
            </Button>
            <Button onClick={handleOnClose} buttonType="muted" testId="cancel-button">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
