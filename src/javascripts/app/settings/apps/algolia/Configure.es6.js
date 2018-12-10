import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Form, TextField, SelectField, Option } from '@contentful/forma-36-react-components';

const SELECT_LOCALE = '___select_locale___';

export default class Configure extends Component {
  static propTypes = {
    index: PropTypes.string,
    localeCode: PropTypes.string,
    locales: PropTypes.arrayOf(PropTypes.object).isRequired,
    onIndexChange: PropTypes.func.isRequired,
    onLocaleCodeChange: PropTypes.func.isRequired
  };

  render() {
    return (
      <Form extraClassNames="algolia-app__config" spacing="condensed">
        <div>
          <h3>Configure</h3>
          <p>Configure how Algolia will store the content type you have selected.</p>
        </div>
        <div className="algolia-app__config-row">
          <TextField
            id="algolia-index-name"
            name="algolia-index-name"
            value={this.props.index || ''}
            labelText="Algolia index name"
            onChange={e => this.props.onIndexChange(e.target.value)}
            helpText={'It can be found in the "Indices" section of your Algolia dashboard.'}
          />
        </div>
        <div className="algolia-app__config-row">
          <SelectField
            id="algolia-locale"
            name="algolia-locale"
            value={this.props.localeCode || SELECT_LOCALE}
            labelText="Locale"
            onChange={e => this.props.onLocaleCodeChange(e.target.value)}
            helpText="Select the locale that you want to index.">
            <Option key={SELECT_LOCALE} value={SELECT_LOCALE}>
              Select locale
            </Option>
            {this.props.locales.map(l => (
              <Option key={l.code} value={l.code}>
                {l.name} ({l.code})
              </Option>
            ))}
          </SelectField>
        </div>
      </Form>
    );
  }
}
