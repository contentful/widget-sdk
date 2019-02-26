import React from 'react';
import PropTypes from 'prop-types';

import { Modal, Button } from '@contentful/forma-36-react-components';
import ModalLauncher from './ModalLauncher.es6';

export default function createUnsavedChangesDialogOpener(save) {
  return () =>
    ModalLauncher.open(({ isShown, onClose }) => (
      <UnsavedChangesDialog key={`${Date.now()}`} save={save} isShown={isShown} onClose={onClose} />
    ));
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
        title="There are unsaved changes"
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEscapePress={false}
        isShown={this.props.isShown}
        onClose={this.cancel}>
        <React.Fragment>
          <p>What would you like to do with them?</p>
          <Button buttonType="primary" onClick={this.save} disabled={working} loading={working}>
            Save changes
          </Button>{' '}
          <Button buttonType="muted" onClick={this.discard} disabled={working}>
            Discard changes
          </Button>{' '}
          <Button buttonType="muted" onClick={this.cancel} disabled={working}>
            Back to editing
          </Button>
        </React.Fragment>
      </Modal>
    );
  }
}
