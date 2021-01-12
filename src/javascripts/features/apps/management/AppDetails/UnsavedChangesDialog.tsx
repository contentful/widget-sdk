import { Button, Modal, Paragraph } from '@contentful/forma-36-react-components';
import React, { useState } from 'react';

interface Props {
  isShown: boolean;
  save: () => Promise<void>;
  onClose: (discard: boolean) => void;
}

export function UnsavedChangesDialog({ isShown, save, onClose }: Props) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await save();
      onClose(true);
    } catch (err) {
      setSaving(false);
    }
  };

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
            <Paragraph>There are unsaved changes. What would you like to do with them?</Paragraph>
            <Paragraph>
              Saving the app definition will have an effect on all of its installations.
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="positive" onClick={handleSave} disabled={saving} loading={saving}>
              Save changes
            </Button>{' '}
            <Button buttonType="muted" onClick={() => onClose(true)} disabled={saving}>
              Discard changes
            </Button>{' '}
            <Button buttonType="muted" onClick={() => onClose(false)} disabled={saving}>
              Back to editing
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
}
