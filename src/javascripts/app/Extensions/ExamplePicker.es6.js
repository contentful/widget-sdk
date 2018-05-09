import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import * as Fetcher from './GitHubFetcher';

const EXAMPLES = [
  {
    name: 'Vanilla UI Extension template',
    description: 'Starter UI Extension. Allows modification of a textual value.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/template-vanilla'
  },
  {
    name: 'External API Dropdown',
    description: 'Populate a dropdown using data fetched from an external service.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/external-api'
  },
  {
    name: 'Diff',
    description: 'Allows diffing draft and published values of a field.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/diff'
  },
  {
    name: 'Alloy Editor',
    description: 'Enables WYSIWYG editing using an open-source Alloy Editor library.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/alloy-editor'
  },
  {
    name: 'Optimizely Audiences',
    description: 'Tag structured content in Contentful with audience IDs loaded from a project in Optimizely.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/optimizely-audiences'
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
    const {onCancel} = this.props;

    return <div className="modal-dialog">
      <header className="modal-dialog__header">
        <h1>Install an example</h1>
        <button className="modal-dialog__close" onClick={onCancel} />
      </header>
      <div className="modal-dialog__content">
        <p className="modal-dialog__richtext">
          You can install one of our predefined UI Extension examples.
        </p>
        <div className="extension-examples">
          {EXAMPLES.map(example => this.renderExample(example))}
        </div>
      </div>
      <div className="modal-dialog__controls">
        <button className="btn-secondary-action" onClick={onCancel}>Close</button>
      </div>
    </div>;
  },
  renderExample (example) {
    const {onConfirm, onCancel} = this.props;
    const {fetching} = this.state;

    return <div key={example.url} className="extension-examples__item">
      <div>
        <h3>
          <a
            href={`${example.url}/README.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {example.name}
          </a>
        </h3>
        <p>{example.description}</p>
      </div>
      <button
        className="btn-action"
        disabled={fetching}
        onClick={() => {
          this.setState(() => ({fetching: true}));
          Fetcher.fetchExtension(`${example.url}/extension.json`).then(onConfirm, onCancel);
        }}
      >
        Install
      </button>
    </div>;
  }
});

export default ExamplePicker;
