/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import ContentTypeIcon from 'svg/page-ct.svg';
import ContentIcon from 'svg/page-content.svg';
import MediaIcon from 'svg/page-media.svg';
import APIsIcon from 'svg/page-apis.svg';
import { Spinner, Icon, Heading, Paragraph } from '@contentful/forma-36-react-components';

const infoItems = [
  {
    Icon: ContentTypeIcon,
    title: 'Content model',
    description:
      'The content model is comprised of content types, they work like a stencil which defines the structure of entries. We’re creating a few different content types for you to see how it works.',
  },
  {
    Icon: ContentIcon,
    title: 'Content',
    description:
      'Your content is made up of entries. The space will include a couple of entries based on the content types mentioned above.',
  },
  {
    Icon: MediaIcon,
    title: 'Media',
    description:
      'Your media consists of assets, which are external files, from images or videos to documents. Your entries will have a few assets to complement them.',
  },
  {
    Icon: APIsIcon,
    title: 'API keys',
    description:
      'An API key is the token that you’ll use to retrieve your content. We created a few API keys so that you can get started fetching your content right away.',
  },
];

class ProgressScreen extends React.Component {
  static propTypes = {
    done: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
  };

  render() {
    const { done, onConfirm } = this.props;

    return (
      <div>
        {!done && <Spinner />}
        {done && (
          <div data-test-id="create-space-progress">
            <Icon icon="CheckCircle" size="large" color="positive" />
          </div>
        )}
        <Heading>Hang on, we’re preparing your space</Heading>
        <Paragraph>
          In the meantime, let us quickly explain the kind of things you’ll find in your space
        </Paragraph>
        <div className="create-new-space__templates__entities">
          {infoItems.map(({ Icon, title, description }) => (
            <div key={title} className="create-new-space__templates__entity">
              <div>
                <Icon />
              </div>
              <div className="create-new-space__templates__entity__description">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn-action"
            data-test-id="get-started"
            disabled={!done}
            onClick={onConfirm}>
            Get started
          </button>
        </div>
      </div>
    );
  }
}

export default ProgressScreen;
