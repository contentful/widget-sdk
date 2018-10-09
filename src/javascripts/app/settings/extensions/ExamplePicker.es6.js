import React from 'react';
import PropTypes from 'prop-types';

import * as Fetcher from './GitHubFetcher.es6';

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
    description:
      'Tag structured content in Contentful with audience IDs loaded from a project in Optimizely.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/optimizely-audiences'
  },
  {
    name: 'Shopify Products',
    description:
      'Connects to a Shopify store and loads products into the Contentful Web App via the Storefront API.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/shopify'
  },
  {
    name: 'Marketo Forms',
    description:
      'Adds the ability to get all the Marketo provided context of your forms into your Contentful entry.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/marketo-forms'
  },
  {
    name: 'Wistia Videos',
    description:
      'This UI extension allows your editors to see a nice dropdown of all the videos in your Wistia account sorted by Projects. Your developers can then use this data to construct landing pages from the data.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/wistia-videos'
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

class ExamplePicker extends React.Component {
  static propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = { fetching: false };

  renderExample(example) {
    const { onConfirm, onCancel } = this.props;
    const { fetching } = this.state;

    return (
      <div key={example.url} className="extension-examples__item">
        <div>
          <h3>{example.name}</h3>
          <p>{example.description}</p>
          <a href={`${example.url}/README.md`} target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
        <button
          className="btn-action"
          disabled={fetching}
          onClick={() => {
            this.setState(() => ({ fetching: true }));
            Fetcher.fetchExtension(`${example.url}/extension.json`).then(extension => {
              return onConfirm({
                extension,
                type: 'github-example',
                url: example.url
              });
            }, onCancel);
          }}>
          Install
        </button>
      </div>
    );
  }

  render() {
    const { onCancel } = this.props;

    return (
      <div className="modal-dialog">
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
          <button className="btn-secondary-action" onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    );
  }
}

export default ExamplePicker;
