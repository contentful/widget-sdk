import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Typography, Paragraph, Button } from '@contentful/forma-36-react-components';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

export const MODAL_TYPES = {
  POC: 'POC',
  COMMITTED: 'COMMITTED',
};

const titles = {
  [MODAL_TYPES.POC]: 'Upgrade space',
  [MODAL_TYPES.COMMITTED]: 'Contact customer success to make this change',
};

const bodies = {
  [MODAL_TYPES.POC]:
    'It seems like you’re ready to launch a proof of concept space. Talk to us to make that happen as soon as possible.',
  [MODAL_TYPES.COMMITTED]:
    'This space is part of your enterprise plan with Contentful. To make any changes, please contact your customer success manager.',
};

export default function ChangeSpaceWarning({ isShown, onClose, type }) {
  return (
    <Modal testId="change-space-warning-modal" isShown={isShown} onClose={onClose}>
      {() => (
        <>
          <Modal.Header title={titles[type]} onClose={() => onClose()} />
          <Modal.Content>
            <Typography>
              <Paragraph>{bodies[type]}</Paragraph>
            </Typography>
          </Modal.Content>
          <Modal.Controls>
            <ContactUsButton buttonType="positive" noIcon onClick={() => onClose()}>
              Talk to us
            </ContactUsButton>
            <Button onClick={() => onClose()} testId="close-button" buttonType="muted">
              Close
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

ChangeSpaceWarning.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf([MODAL_TYPES.POC, MODAL_TYPES.COMMITTED]),
};

export function open(type) {
  if (!(type in MODAL_TYPES)) {
    throw new Error(`Invalid valid type ${type} supplied to ChangeSpaceWarning.open`);
  }

  ModalLauncher.open(({ isShown, onClose }) => (
    <ChangeSpaceWarning isShown={isShown} onClose={onClose} type={type} />
  ));
}
