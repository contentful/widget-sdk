import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Button } from '@contentful/ui-component-library';
import base64safe from './base64safe.es6';

export default class WebhookHttpBasicDialog extends React.Component {
  static propTypes = {
    confirm: PropTypes.func.isRequired
  };

  state = {};

  addHeader = () => {
    const { user, password } = this.state;
    this.props.confirm({
      key: 'Authorization',
      value: 'Basic ' + base64safe([user || '', password || ''].join(':')),
      secret: true
    });
  };

  cancel = () => this.props.confirm({});

  render() {
    return (
      <div className="modal-dialog webhook-secret-header-dialog">
        <header className="modal-dialog__header">
          <h1>Add HTTP Basic Auth header</h1>
        </header>
        <div className="modal-dialog__content">
          <div className="modal-dialog__richtext">
            This form will automatically generate a secure <code>Authorization</code> header
            containing correctly formated HTTP Basic Auth information.
          </div>
          <div className="webhook-secret-header-dialog__input">
            <TextField
              id="http-basic-user"
              name="http-basic-user"
              value={this.state.user || ''}
              onChange={e => this.setState({ user: e.target.value })}
              labelText="User"
              textInputProps={{ type: 'text' }}
            />
          </div>
          <div className="webhook-secret-header-dialog__input">
            <TextField
              id="http-basic-password"
              name="http-basic-password"
              value={this.state.password || ''}
              onChange={e => this.setState({ password: e.target.value })}
              labelText="Password"
              textInputProps={{ type: 'password' }}
            />
          </div>
          <div className="modal-dialog__richtext">
            Some APIs require only the username or only the password, so the form can be confirmed
            with only one value provided.
          </div>
        </div>
        <div className="modal-dialog__controls">
          <Button
            onClick={this.addHeader}
            disabled={!this.state.user && !this.state.password}
            buttonType="primary">
            Add HTTP Basic Auth header
          </Button>
          <Button onClick={this.cancel} buttonType="muted">
            Cancel
          </Button>
        </div>
      </div>
    );
  }
}
