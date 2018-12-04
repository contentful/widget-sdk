import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';

export default class SidebarContentPreview extends Component {
  static propTypes = {
    isInitialized: PropTypes.bool.isRequired,
    isPreviewSetup: PropTypes.bool.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    selectedContentPreview: PropTypes.shape({
      compiledUrl: PropTypes.string,
      name: PropTypes.string
    }).isRequired,
    contentPreviews: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired
      })
    ).isRequired,
    onChangeContentPreview: PropTypes.func.isRequired,
    trackPreviewOpened: PropTypes.func.isRequired
  };

  state = {
    isOpenSelector: false
  };

  renderNoPreviewNote() {
    const { isAdmin } = this.props;
    return (
      <div className="entity-sidebar__help-text" role="note" data-test-id="open-preview-note">
        {isAdmin && (
          <React.Fragment>
            <p>No preview is set up for the content type of this entry.</p>{' '}
            <StateLink to="^.^.settings.content_preview.list">
              Click here to set up a custom content preview.
            </StateLink>
          </React.Fragment>
        )}
        {!isAdmin && (
          <React.Fragment>
            No content preview is set up yet. To set up your preview, contact the administrator of
            this space.
          </React.Fragment>
        )}
      </div>
    );
  }

  renderPreviewSelector() {
    const { selectedContentPreview, contentPreviews, onChangeContentPreview } = this.props;
    return (
      <div className="entity-sidebar__preview__toggle">
        <div className="entity-sidebar__preview__platform">
          <strong>Platform: </strong> {selectedContentPreview.name}
        </div>
        <Dropdown
          testId="change-preview"
          isOpen={this.state.isOpenSelector}
          onClose={() => this.setState({ isOpenSelector: false })}
          position="bottom-right"
          toggleElement={
            <span
              onClick={() => {
                this.setState({ isOpenSelector: true });
              }}
              className="entity-sidebar__preview__change">
              Change
            </span>
          }>
          <DropdownList>
            {contentPreviews.map(preview => (
              <DropdownListItem
                key={preview.name}
                onClick={() => {
                  onChangeContentPreview(preview);
                  this.setState({ isOpenSelector: false });
                }}>
                {preview.name}
              </DropdownListItem>
            ))}
          </DropdownList>
        </Dropdown>
      </div>
    );
  }

  render() {
    const {
      isPreviewSetup,
      selectedContentPreview,
      contentPreviews,
      trackPreviewOpened,
      isInitialized
    } = this.props;

    return (
      <div className="entity-sidebar__preview">
        <Button
          disabled={!isInitialized || !isPreviewSetup || !selectedContentPreview.compiledUrl}
          testId="open-preview"
          isFullWidth
          onClick={trackPreviewOpened}
          buttonType="muted"
          icon="ExternalLink"
          href={selectedContentPreview.compiledUrl}
          target="_blank"
          rel="noopener noreferrer">
          Open preview
        </Button>
        {isInitialized && !isPreviewSetup && this.renderNoPreviewNote()}
        {isInitialized &&
          isPreviewSetup &&
          contentPreviews.length > 1 &&
          this.renderPreviewSelector()}
      </div>
    );
  }
}
