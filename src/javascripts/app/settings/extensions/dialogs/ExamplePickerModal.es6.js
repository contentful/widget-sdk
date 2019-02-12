import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from '@contentful/forma-36-react-components';

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
    name: 'Publish button with confirmation',
    description: 'Requires a user to confirm they really want to (un)publish an entry.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/publish-confirm'
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
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  static getInitialState() {
    return { fetching: false };
  }

  state = ExamplePicker.getInitialState();

  componentDidUpdate(prevProps) {
    if (prevProps.isShown !== this.props.isShown) {
      this.setState(ExamplePicker.getInitialState());
    }
  }

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
        <Button
          testId="install-extension"
          buttonType="primary"
          disabled={fetching}
          onClick={() => {
            this.setState(() => ({ fetching: true }));
            Fetcher.fetchExtension(`${example.url}/extension.json`).then(
              extension => {
                return onConfirm({
                  extension,
                  url: example.url
                });
              },
              error => {
                onCancel(error);
              }
            );
          }}>
          Install
        </Button>
      </div>
    );
  }

  render() {
    const { onCancel, isShown } = this.props;
    return (
      <Modal size="large" isShown={isShown} onClose={onCancel}>
        {() => (
          <React.Fragment>
            <Modal.Header title="Install an example" onClose={onCancel}>
              Install an example
            </Modal.Header>
            <Modal.Content>
              <p>You can install example UI Extensions we provide:</p>
              <div className="extension-examples">
                {EXAMPLES.map(example => this.renderExample(example))}
              </div>
            </Modal.Content>
            <Modal.Controls>
              <Button onClick={onCancel} buttonType="muted">
                Close
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    );
  }
}

export default ExamplePicker;
