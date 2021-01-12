import { Button, Modal, Paragraph } from '@contentful/forma-36-react-components';
import React from 'react';

interface Props {
  isShown: boolean;
  onClose: (discard: boolean) => void;
}

export function InvalidChangesDialog({ isShown, onClose }: Props) {
  return (
    <Modal
      size={600}
      title="Unsaved changes"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}
      isShown={isShown}
      onClose={() => onClose(true)}>
      {() => (
        <React.Fragment>
          <Modal.Header title="Unsaved changes" />
          <Modal.Content>
            <Paragraph>There are invalid changes that will not be saved.</Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="negative" onClick={() => onClose(true)}>
              Discard changes
            </Button>{' '}
            <Button buttonType="muted" onClick={() => onClose(false)}>
              Back to editing
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
}
