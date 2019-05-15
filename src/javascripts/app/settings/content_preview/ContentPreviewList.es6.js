import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink.es6';
import Icon from 'ui/Components/Icon.es6';
import { EmptyState, Button } from '@contentful/forma-36-react-components';
import EmptyStateIllustration from 'svg/content-preview-empty-state.es6';

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
      <EmptyState
        headingProps={{ text: 'Set up content preview ' }}
        customImageElement={
          <div style={{ width: '280px' }}>
            <EmptyStateIllustration />
          </div>
        }
        descriptionProps={{
          text:
            'To view your content in a live environment, set up content preview. Learn how to set up a custom content preview for this space in our guide.'
        }}>
        <StateLink to="^.new">
          {({ onClick }) => (
            <Button
              icon="PlusCircle"
              buttonType="primary"
              onClick={onClick}
              testId="add-content-preview-button">
              Set up content preview
            </Button>
          )}
        </StateLink>
      </EmptyState>
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
