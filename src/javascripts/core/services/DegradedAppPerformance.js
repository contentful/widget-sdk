import React from 'react';
import { Modal, Typography, Paragraph, Button } from '@contentful/forma-36-react-components';
import { ModalLauncher } from 'core/components/ModalLauncher';
import ContactUsButton from 'ui/Components/ContactUsButton';

let modalTriggered;

export function init() {
  modalTriggered = false;
}

export function trigger() {
  if (modalTriggered) {
    return;
  }

  modalTriggered = true;

  ModalLauncher.open(({ isShown, onClose }) => (
    <Modal
      testId="degraded-app-performance-modal"
      isShown={isShown}
      onClose={onClose}
      title="This will only take a minute ⏳">
      <Typography>
        <Paragraph>
          We’ve experienced some issues that may impact your Contentful experience.{' '}
          <strong>You can continue to use the app</strong>, but features may be unavailable and the
          app may be in a degraded state of performance.
        </Paragraph>
        <Paragraph>
          We recommend you refresh the page and disable any adblockers on Contentful.
        </Paragraph>
        <Paragraph>
          <ContactUsButton isLink noIcon>
            Talk to us
          </ContactUsButton>{' '}
          if you continue to receive this message or if it impacts your app usage.
        </Paragraph>
        <Button testId="close-modal" onClick={() => onClose()}>
          OK
        </Button>
      </Typography>
    </Modal>
  ));
}
