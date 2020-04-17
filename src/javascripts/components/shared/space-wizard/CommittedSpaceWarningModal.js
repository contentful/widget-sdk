import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Paragraph, Typography, Button } from '@contentful/forma-36-react-components';
import { ModalLauncher } from 'core/components/ModalLauncher';

import { supportUrl } from 'Config';
import * as Intercom from 'services/intercom';

export default class CommittedSpaceWarningModal extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
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
            <Modal.Header
              title="Contact customer success to make this change"
              onClose={this.props.onClose}
            />
            <Modal.Content>
              <Typography>
                <Paragraph>
                  This space is part of your Enterprise plan with Contentful. To make any changes,
                  please contact your customer success manager.
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
    <CommittedSpaceWarningModal isShown={isShown} onClose={onClose} />
  ));
}
