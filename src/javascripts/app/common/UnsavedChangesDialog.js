import React from 'react';
import PropTypes from 'prop-types';

import { Modal, Button, Paragraph } from '@contentful/forma-36-react-components';
import ModalLauncher from './ModalLauncher';

/**
 * @param {function} save
 * @param {object={}} modalOpts Options for the ModalLauncher
 * @param {string} modalOpts.modalId The id to use for the resulting UnsavedChangesDialog. Defaults to the current epoch ms
 */
export default function createUnsavedChangesDialogOpener(save, modalOpts = {}) {
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
      modalOpts
    );
}

class UnsavedChangesDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired
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
