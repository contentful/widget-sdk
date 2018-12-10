import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Form, SelectField, Option } from '@contentful/forma-36-react-components';

const SELECT_CONTENT_TYPE = '___select_content_type___';

export default class Select extends Component {
  static propTypes = {
    selectedContentTypeId: PropTypes.string,
    contentTypes: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired
      })
    ).isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    return (
      <Form extraClassNames="algolia-app__config" spacing="condensed">
        <div>
          <h3>Select content type</h3>
          <p>Choose the content type that you want to enable for search.</p>
        </div>
        <div className="algolia-app__config-row">
          <SelectField
            id="algolia-content-type"
            name="algolia-content-type"
            labelText="Content type"
            onChange={e => this.props.onChange(e.target.value)}
            value={this.props.selectedContentTypeId || SELECT_CONTENT_TYPE}>
            <Option key={SELECT_CONTENT_TYPE} value={SELECT_CONTENT_TYPE}>
              Select a content type
            </Option>
            {this.props.contentTypes.map(this.renderOption)}
          </SelectField>
        </div>
      </Form>
    );
  }

  renderOption = ct => {
    return (
      <Option key={ct.sys.id} value={ct.sys.id}>
        {ct.name}
      </Option>
    );
  };
}
