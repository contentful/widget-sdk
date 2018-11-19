import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink.es6';
import Icon from 'ui/Components/Icon.es6';
import CreatePreviewButton from './CreatePreviewButton.es6';

const placeholderContentPreviews = [
  {
    sys: {
      id: 'fake-1'
    },
    name: 'Main Website',
    description: 'Content preview for the main website'
  },
  {
    sys: {
      id: 'fake-2'
    },
    name: 'Landing Page',
    description: 'Content preview for the landing page'
  },
  {
    sys: {
      id: 'fake-3'
    },
    name: 'Event Page',
    description: 'Content preview for the event page'
  }
];

const ContentPreviewItem = ({ preview }) => (
  <React.Fragment>
    <span>
      <h3 className="entity-list__heading">{preview.name}</h3>
      <span className="entity-list__description">{preview.description}</span>
    </span>
    <Icon className="entity-list__icon" name="dd-arrow-down" />
  </React.Fragment>
);
ContentPreviewItem.propTypes = {
  preview: PropTypes.object.isRequired
};

export default class ContentPreviewList extends Component {
  static propTypes = {
    contentPreviews: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired
      })
    ).isRequired
  };

  renderList() {
    return this.props.contentPreviews.map(preview => (
      <StateLink
        className="entity-list__item x--with-icon"
        key={preview.sys.id}
        to="^.detail"
        params={{ contentPreviewId: preview.sys.id }}>
        <ContentPreviewItem preview={preview} />
      </StateLink>
    ));
  }

  renderPlaceholderList() {
    return (
      <React.Fragment>
        {placeholderContentPreviews.map(preview => (
          <div
            className="entity-list__item content-preview-list__placeholder x--with-icon"
            key={preview.sys.id}>
            <ContentPreviewItem preview={preview} />
          </div>
        ))}
        <div className="cfnext-advice-box content-preview-list__advice">
          <div className="cfnext-advice-box__frame">
            <h1 className="cfnext-advice-box__title">
              Whoops, looks like you haven‘t set up a content preview
            </h1>
            <div className="cfnext-advice-box__sub-title" />
            <div className="content-preview-list__advice-button-container">
              <CreatePreviewButton />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  render() {
    const { contentPreviews } = this.props;
    return (
      <div className="content-preview-list entity-list">
        {contentPreviews.length > 0 ? this.renderList() : this.renderPlaceholderList()}
      </div>
    );
  }
}
