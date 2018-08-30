import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { asReact } from 'ui/Framework/DOMRenderer.es6';
import CheckmarkIcon from 'svg/checkmark.es6';
import ContentTypeIcon from 'svg/page-ct.es6';
import ContentIcon from 'svg/page-content.es6';
import MediaIcon from 'svg/page-media.es6';
import APIsIcon from 'svg/page-apis.es6';

const infoItems = [
  {
    icon: ContentTypeIcon,
    title: 'Content model',
    description:
      'The content model is comprised of content types, they work like a stencil which defines the structure of entries. We’re creating a few different content types for you to see how it works.'
  },
  {
    icon: ContentIcon,
    title: 'Content',
    description:
      'Your content is made up of entries. The space will include a couple of entries based on the content types mentioned above.'
  },
  {
    icon: MediaIcon,
    title: 'Media',
    description:
      'Your media consists of assets, which are external files, from images or videos to documents. Your entries will have a few assets to complement them.'
  },
  {
    icon: APIsIcon,
    title: 'API keys',
    description:
      'An API key is the token that you’ll use to retrieve your content. We created a few API keys so that you can get started fetching your content right away.'
  }
];

const ProgressScreen = createReactClass({
  propTypes: {
    done: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired
  },
  render() {
    const { done, onConfirm } = this.props;

    return (
      <div>
        <div className="create-new-space__templates__status" data-test-id="create-space-progress">
          {!done && <div className="spinner" />}
          {done && (
            <div style={{ transform: 'scale(2)' }} data-test-id="create-space-create-done">
              {asReact(CheckmarkIcon)}
            </div>
          )}
        </div>
        <h2 className="create-space-wizard__heading">Hang on, we’re preparing your space</h2>
        <p className="create-space-wizard__subheading">
          In the meantime, let us quickly explain the kind of things you’ll find in your space
        </p>
        <div className="create-new-space__templates__entities">
          {infoItems.map(({ icon, title, description }) => (
            <div key={title} className="create-new-space__templates__entity">
              <div>{asReact(icon)}</div>
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
});

export default ProgressScreen;
