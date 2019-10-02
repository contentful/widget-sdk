import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Paragraph, Typography, Button } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import { supportUrl } from 'Config.es6';
import * as Intercom from 'services/intercom.es6';

export default class POCSpaceWarningModal extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
  };

  handleContact = () => {
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
    this.props.onClose();
  };

  render() {
    return (
      <Modal isShown={this.props.isShown} testId="committed-space-change-warning">
        {() => (
          <React.Fragment>
            <Modal.Header title="Upgrade space" onClose={this.props.onClose} />
            <Modal.Content>
              <Typography>
                <Paragraph>
                  It seems like you’re ready to launch a proof of concept (space trial) space. Talk
                  to us to make that happen as soon as possible.
                </Paragraph>
              </Typography>
            </Modal.Content>
            <Modal.Controls>
              <Button onClick={this.handleContact} buttonType="positive">
                Talk to us
              </Button>
              <Button onClick={this.props.onClose} buttonType="muted">
                Close
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    );
  }
}

export function openModal() {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <POCSpaceWarningModal isShown={isShown} onClose={onClose} />
  ));
}
