import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, TextField, Modal } from '@contentful/ui-component-library';

export class WebhookSecretHeaderForm extends Component {
  static propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = {
    key: '',
    value: ''
  };

  onConfirm = () => {
    this.props.onConfirm({
      key: this.state.key,
      value: this.state.value
    });
  };

  render() {
    return (
      <React.Fragment>
        <Modal.Header title="Add secret header" onClose={this.props.onCancel} />
        <Modal.Content>
          <p>
            Values of secret headers are only used when calling the Webhook URL. They are hidden in
            the Web App, API responses and logs. To modify a secret header you need to remove and
            recreate it.
          </p>
          <TextField
            id="secret-header-key"
            name="secret-header-key"
            value={this.state.key || ''}
            onChange={e => this.setState({ key: e.target.value })}
            required
            labelText="Key"
            textInputProps={{ type: 'text' }}
          />
          <div style={{ marginTop: 10 }} />
          <TextField
            id="secret-header-value"
            name="secret-header-key"
            value={this.state.value || ''}
            onChange={e => this.setState({ value: e.target.value })}
            required
            labelText="Value"
            textInputProps={{ type: 'password' }}
          />
        </Modal.Content>
        <Modal.Controls>
          <Button
            onClick={this.onConfirm}
            disabled={!this.state.key || !this.state.value}
            buttonType="primary"
            testId="add-secret-header-button">
            Add secret header
          </Button>
          <Button
            onClick={this.props.onCancel}
            buttonType="muted"
            testId="close-secret-header-button">
            Cancel
          </Button>
        </Modal.Controls>
      </React.Fragment>
    );
  }
}

export default function WebhookSecretHeaderDialog(props) {
  return (
    <Modal isShown={props.isShown} onClose={props.onCancel}>
      {() => <WebhookSecretHeaderForm onConfirm={props.onConfirm} onCancel={props.onCancel} />}
    </Modal>
  );
}

WebhookSecretHeaderDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
