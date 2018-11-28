import React from 'react';
import PropTypes from 'prop-types';
import { Button, TextField, Modal } from '@contentful/forma-36-react-components';
import base64safe from '../base64safe.es6';

export class WebhookHttpBasicForm extends React.Component {
  static propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
  };

  state = {
    user: '',
    password: ''
  };

  addHeader = () => {
    const { user, password } = this.state;
    this.props.onConfirm({
      key: 'Authorization',
      value: 'Basic ' + base64safe([user || '', password || ''].join(':'))
    });
  };

  render() {
    return (
      <React.Fragment>
        <Modal.Header title="Add HTTP Basic Auth header" onClose={this.props.onCancel} />
        <Modal.Content>
          <p>
            This form will automatically generate a secure <code>Authorization</code> header
            containing correctly formated HTTP Basic Auth information.
          </p>
          <TextField
            id="http-basic-user"
            name="http-basic-user"
            value={this.state.user}
            onChange={e => this.setState({ user: e.target.value })}
            labelText="User"
          />
          <div style={{ marginTop: 10 }} />
          <TextField
            id="http-basic-password"
            name="http-basic-password"
            value={this.state.password}
            onChange={e => this.setState({ password: e.target.value })}
            labelText="Password"
            textInputProps={{ type: 'password' }}
          />
          <div style={{ marginTop: 10 }} />
          <p>
            Some APIs require only the username or only the password, so the form can be confirmed
            with only one value provided.
          </p>
        </Modal.Content>
        <Modal.Controls>
          <Button
            onClick={this.addHeader}
            disabled={!this.state.user && !this.state.password}
            buttonType="primary"
            testId="add-http-header-button">
            Add HTTP Basic Auth header
          </Button>
          <Button
            onClick={this.props.onCancel}
            buttonType="muted"
            testId="close-add-http-header-dialog-button">
            Cancel
          </Button>
        </Modal.Controls>
      </React.Fragment>
    );
  }
}

export default function WebhookHttpBasicDialog(props) {
  return (
    <Modal isShown={props.isShown} onClose={props.onCancel}>
      {() => <WebhookHttpBasicForm onConfirm={props.onConfirm} onCancel={props.onCancel} />}
    </Modal>
  );
}

WebhookHttpBasicDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
