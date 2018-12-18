import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Form,
  Button,
  TextField,
  Notification
} from '@contentful/forma-36-react-components';

export default class APIKeyModal extends Component {
  static propTypes = {
    apiKey: PropTypes.string.isRequired,
    onCredentialsChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
  };

  onSave = () => {
    if (!(this.props.apiKey || '').trim()) {
      return Notification.error('A valid API Key is required');
    }

    return this.props.onClose();
  };

  render() {
    return (
      <Modal size="600px" isShown={true}>
        {() => (
          <React.Fragment>
            <Modal.Header title="Algolia Admin API Key" />
            <Form extraClassNames="algolia-app__config-modal-form" spacing="condensed">
              <TextField
                id="algolia-api-key"
                name="algolia-api-key"
                labelText="Re-enter your Algolia Admin API Key"
                value={this.props.apiKey}
                onChange={e => this.props.onCredentialsChange({ apiKey: e.target.value })}
                helpText="We need your Algolia API key in order to make changes."
                textInputProps={{ type: 'password' }}
                required
              />
              <footer className="algolia-app__config-api-key-modal-buttons">
                <Button buttonType="primary" onClick={this.onSave}>
                  Next
                </Button>
              </footer>
            </Form>
          </React.Fragment>
        )}
      </Modal>
    );
  }
}
