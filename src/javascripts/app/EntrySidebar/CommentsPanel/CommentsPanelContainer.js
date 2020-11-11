import React from 'react';
import PropTypes from 'prop-types';
import CommentsPanel from './CommentsPanel';
import { getAllForEntry } from 'data/CMA/CommentsRepo';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';

/**
 * This component is the bridge between the EntitySidebar and the CommentPanel components.
 * It receives an endpoint and entityId via an event.
 * The CommentPanel component is only rendered after this data is available
 * This component also takes care of listening to an event to decide when
 * to show or hide the comments panel.
 */
export default class CommentsPanelContainer extends React.Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    entryId: PropTypes.string.isRequired,
    onCommentsCountUpdate: PropTypes.func.isRequired,
  };

  static contextType = SpaceEnvContext;

  state = {
    isInitialized: false,
  };

  initComments() {
    const { entryId, onCommentsCountUpdate } = this.props;
    const { currentSpaceId, currentEnvironmentId, currentEnvironment } = this.context;
    const endpoint = createSpaceEndpoint(
      currentSpaceId,
      isMasterEnvironment(currentEnvironment) ? undefined : currentEnvironmentId
    );

    // Showing the count is low-priority so we can defer fetching it
    if (window.requestIdleCallback !== undefined) {
      window.requestIdleCallback(fetchCommentsCount);
    } else {
      const sensibleDelay = 1000;
      setTimeout(fetchCommentsCount, sensibleDelay);
    }

    async function fetchCommentsCount() {
      const { items: comments } = await getAllForEntry(endpoint, entryId);
      onCommentsCountUpdate(comments.length);
    }
  }

  componentDidMount() {
    !this.state.isInitialized && this.initComments();
  }

  componentDidUpdate() {
    if (this.props.isVisible && !this.state.isInitialized) {
      this.setState({ isInitialized: true });
    }
  }

  render() {
    const { isInitialized } = this.state;
    const { entryId, onCommentsCountUpdate, isVisible } = this.props;
    return (
      isInitialized && (
        <CommentsPanel
          entryId={entryId}
          isVisible={isVisible}
          onCommentsCountUpdate={onCommentsCountUpdate}
        />
      )
    );
  }
}
