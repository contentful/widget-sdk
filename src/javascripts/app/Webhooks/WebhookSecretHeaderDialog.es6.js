import React from 'react';
import PropTypes from 'prop-types';
import {TextField, Button} from '@contentful/ui-component-library';

export default class WebhookSecretHeaderDialog extends React.Component {
  static propTypes = {
    confirm: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props);
    this.state = {secret: true};
  }

  render () {
    const {confirm} = this.props;

    return (
      <div className="modal-dialog webhook-secret-header-dialog">
        <header className="modal-dialog__header">
          <h1>Add secret header</h1>
        </header>
        <div className="modal-dialog__content">
          <div className="modal-dialog__richtext">
            Values of secret headers are only used when calling the Webhook URL.
            They are hidden in the Web App, API responses and logs.
            To modify a secret header you need to remove and recreate it.
          </div>
          <div className="webhook-secret-header-dialog__input">
            <TextField
              id="secret-header-key"
              name="secret-header-key"
              value={this.state.key || ''}
              onChange={e => this.setState({key: e.target.value})}
              required
              labelText="Key"
              textInputProps={{type: 'text'}}
            />
          </div>
          <div className="webhook-secret-header-dialog__input">
            <TextField
              id="secret-header-value"
              name="secret-header-key"
              value={this.state.value || ''}
              onChange={e => this.setState({value: e.target.value})}
              required
              labelText="Value"
              textInputProps={{type: 'password'}}
            />
          </div>
        </div>
        <div className="modal-dialog__controls">
          <Button
            onClick={() => confirm(this.state)}
            disabled={!this.state.key || !this.state.value}
            buttonType="primary"
          >
            Add secret header
          </Button>
          <Button onClick={() => confirm({})} buttonType="muted">
            Cancel
          </Button>
        </div>
      </div>
    );
  }
}
