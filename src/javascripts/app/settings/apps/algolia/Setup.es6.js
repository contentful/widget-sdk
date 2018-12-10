import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Form, TextField } from '@contentful/forma-36-react-components';

export default class Setup extends Component {
  static propTypes = {
    appId: PropTypes.string,
    apiKey: PropTypes.string,
    installed: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    return (
      <Form spacing="condensed">
        <div>
          <h3>Algolia credentials</h3>
          {!this.props.installed && <p>Contentful needs to be linked to your Algolia account.</p>}
          {this.props.installed && (
            <p>
              Connected to Algolia application: <code>{this.props.appId}</code>.
            </p>
          )}
        </div>
        {!this.props.installed && (
          <div className="algolia-app__config-row">
            <TextField
              id="algolia-app-id"
              name="algolia-app-id"
              value={this.props.appId || ''}
              labelText="Algolia App ID"
              onChange={e => this.props.onChange({ appId: e.target.value })}
              helpText="Algolia application identifier. It can be found in your Algolia dashboard."
            />
          </div>
        )}
        {!this.props.installed && (
          <div className="algolia-app__config-row">
            <TextField
              id="algolia-api-key"
              name="algolia-api-key"
              value={this.props.apiKey || ''}
              labelText="Algolia write API key"
              onChange={e => this.props.onChange({ apiKey: e.target.value })}
              helpText="It can be found in your Algolia Dashboard. Securely stored."
              textInputProps={{ type: 'password' }}
            />
          </div>
        )}
      </Form>
    );
  }
}
