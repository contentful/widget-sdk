import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {byName as Colors} from 'Styles/Colors';

import * as Fetcher from './GitHubFetcher';

const EXAMPLES = [
  {
    name: 'Vanilla UI Extension template',
    description: 'Starter UI Extension. Allows modification of a textual value.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/template-vanilla/extension.json'
  },
  {
    name: 'External API Dropdown',
    description: 'Populate a dropdown using data fetched from an external service.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/external-api/extension.json'
  },
  {
    name: 'Diff',
    description: 'Allows diffing draft and published values of a field.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/diff/extension.json'
  },
  {
    name: 'Alloy Editor',
    description: 'Enables WYSIWYG editing using an open-source Alloy Editor library.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/alloy-editor/extension.json'
  },
  {
    name: 'Optimizely Audiences',
    description: 'Tag structured content in Contentful with audience IDs loaded from a project in Optimizely.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/optimizely-audiences/extension.json'
  }
];

const ExamplePicker = createReactClass({
  propTypes: {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  },
  getInitialState () {
    return {fetching: false};
  },
  render () {
    const {onConfirm, onCancel} = this.props;
    const {fetching} = this.state;

    return <div className="modal-dialog">
      <header className="modal-dialog__header">
        <h1>Install an example</h1>
        <button className="modal-dialog__close" onClick={onCancel} />
      </header>
      <div className="modal-dialog__content">
        <p className="modal-dialog__richtext">
          You can install one of our predefined UI Extension examples.
        </p>
        <div style={{
          border: `1px solid ${Colors.iceDark}`,
          borderWidth: '1px 0',
          backgroundColor: Colors.elementLightest,
          width: '600px',
          maxHeight: '450px',
          overflow: 'auto'
        }}>
          {EXAMPLES.map(example => {
            return <div key={example.url} style={{
              color: Colors.textDark,
              padding: '10px 20px',
              border: `1px solid ${Colors.iceDark}`,
              borderTopWidth: '0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3>{example.name}</h3>
                <p>{example.description}</p>
              </div>
              <button
                className="btn-action"
                style={{marginLeft: '40px'}}
                disabled={fetching}
                onClick={() => {
                  this.setState(() => ({fetching: true}));
                  Fetcher.fetchExtension(example.url).then(onConfirm, onCancel);
                }}
              >
                Install
              </button>
            </div>;
          })}
        </div>
      </div>
      <div className="modal-dialog__controls">
        <button className="btn-secondary-action" onClick={onCancel}>Close</button>
      </div>
    </div>;
  }
});

export default ExamplePicker;
