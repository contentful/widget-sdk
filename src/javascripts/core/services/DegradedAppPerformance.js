import React from 'react';
import { Modal, Typography, Paragraph, Button } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import ContactUsButton from 'ui/Components/ContactUsButton';
import * as Telemetry from 'i13n/Telemetry';
import * as Analytics from 'analytics/Analytics';
import { getBrowserStorage } from 'core/services/BrowserStorage';

let modalTriggered;

export function init() {
  modalTriggered = false;
}

export function trigger(reason) {
  const store = getBrowserStorage();

  // Many contract tests fail because they don't disable/mock flags, and LaunchDarly will trigger this
  // in those cases. This isn't a great solution but it's a good temporary fix while a longer term
  // solution is brainstormed.
  if (modalTriggered || store.get('__disable_degraded_app_performance')) {
    return;
  }

  modalTriggered = true;

  Telemetry.count('degraded-app-performance-modal-shown', {
    reason,
  });
  Analytics.track('degraded_app_performance:modal_shown', {
    reason,
  });

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
