import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import * as Fetcher from './GitHubFetcher';

const EXAMPLES = [
  {
    name: 'Vanilla UI Extension template',
    description: 'A vanilla template showing the basic flow of data in a UI Extension.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/template-vanilla'
  },
  {
    name: 'External API Dropdown',
    description: 'Populates a dropdown using data fetched from an external service.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/external-api'
  },
  {
    name: 'Optimizely Audiences',
    description: 'Tag structured content in Contentful with audience IDs loaded from a project in Optimizely.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/optimizely-audiences'
  },
  {
    name: 'Shopify Products',
    description: 'Connects to a Shopify store and loads products into the Contentful Web App via the Storefront API.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/shopify'
  },
  {
    name: 'Diff',
    description: 'Renders a diff of draft and published values below a field.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/diff'
  },
  {
    name: 'Alloy Editor',
    description: 'Enables WYSIWYG editing using the open-source Alloy Editor library.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/alloy-editor'
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
          You can install example UI Extensions we provide:
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
        <h3>{example.name}</h3>
        <p>{example.description}</p>
        <a
          href={`${example.url}/README.md`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
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
