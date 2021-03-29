import React from 'react';
import { Button, Modal } from '@contentful/forma-36-react-components';

const FeatureModal = ({
  isShown,
  onClose,
  name,
  primaryCtaAdmins,
  helpCenterUrl,
  secondaryCtaForAdmins,
  learnMore,
}) => {
  return (
    <Modal isShown={isShown} onClose={onClose} size="large">
      {() => (
        <div>
          <Modal.Header title={`${name}`} onClose={onClose} />
          <Modal.Content>Content from rich content editor</Modal.Content>
          <Modal.Controls position="right">
            <Button buttonType="muted" href={learnMore}>
              {secondaryCtaForAdmins}
            </Button>
            <Button buttonType="primary" href={helpCenterUrl}>
              {primaryCtaAdmins}
            </Button>
          </Modal.Controls>
        </div>
      )}
    </Modal>
  );
};

export { FeatureModal };
