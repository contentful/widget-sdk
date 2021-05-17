import React from 'react';
import PropTypes from 'prop-types';
import { useBlocker, useLocation } from 'core/react-routing';
import { ModalLauncher, Modal, Button, Paragraph } from '@contentful/forma-36-react-components';

export default function createUnsavedChangesDialogOpener(save) {
  return () =>
    ModalLauncher.open(
      ({ isShown, onClose }) => (
        <UnsavedChangesDialog
          key={`${Date.now()}`}
          save={save}
          isShown={isShown}
          onClose={onClose}
        />
      ),
      { modalId: 'UnsavedChangesDialog' }
    );
}

export function UnsavedChangesBlocker({ when, save }) {
  const location = useLocation();
  // Re-create blocker on location change to re-enable blocking once previous tx was retried due to ignoreLeaveConfirmation
  const blocker = React.useCallback(
    (tx) => {
      if (tx.location?.state?.ignoreLeaveConfirmation) {
        return tx.retry();
      }

      ModalLauncher.open(
        ({ isShown, onClose }) => (
          <UnsavedChangesDialog
            key={`${Date.now()}`}
            save={save}
            isShown={isShown}
            onClose={onClose}
          />
        ),
        { modalId: 'UnsavedChangesDialog' }
      ).then((result) => {
        if (result) {
          tx.retry();
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [save, location]
  );

  useBlocker(blocker, when);

  return null;
}

class UnsavedChangesDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
  };

  state = { working: false };

  save = async () => {
    try {
      this.setState({ working: true });
      await this.props.save();
      this.props.onClose(true);
    } catch (err) {
      this.setState({ working: false });
    }
  };

  discard = () => this.props.onClose({ discarded: true });

  cancel = () => this.props.onClose(false);

  render() {
    const { working } = this.state;

    return (
      <Modal
        size={600}
        title="There are unsaved changes"
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEscapePress={false}
        isShown={this.props.isShown}
        onClose={this.cancel}>
        {() => (
          <React.Fragment>
            <Modal.Header title="There are unsaved changes" />
            <Modal.Content>
              <Paragraph>What would you like to do with them?</Paragraph>
            </Modal.Content>
            <Modal.Controls>
              <Button
                buttonType="positive"
                onClick={this.save}
                disabled={working}
                loading={working}>
                Save changes
              </Button>{' '}
              <Button buttonType="muted" onClick={this.discard} disabled={working}>
                Discard changes
              </Button>{' '}
              <Button buttonType="muted" onClick={this.cancel} disabled={working}>
                Back to editing
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    );
  }
}
