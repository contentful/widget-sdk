import React from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes';
import SidebarWidgetTypes from '../SidebarWidgetTypes';
import CommentsPanel from './CommentsPanel';

/**
 * This component is the bridge between the EntitySidebar and the CommentPanel components.
 * It receives an endpoint and entityId via an event.
 * The CommentPanel component is only rendered after this data is available
 * This component also takes care of listening to an event to decide when
 * to show or hide the comments panel.
 */
export default class CommentsPanelContainer extends React.Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired,
    isVisible: PropTypes.bool.isRequired,
  };

  state = {
    initialized: false,
  };

  componentDidMount() {
    const { emitter } = this.props;
    emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.COMMENTS_PANEL);
    emitter.on(SidebarEventTypes.INIT_COMMENTS_PANEL, ({ endpoint, entryId }) => {
      this.setState({ initialized: true, endpoint, entryId });
    });
  }

  onCommentsCountUpdate = (commentsCount) => {
    this.props.emitter.emit(SidebarEventTypes.UPDATED_COMMENTS_COUNT, commentsCount);
  };

  componentWillUnmount() {
    this.props.emitter.emit(
      SidebarEventTypes.WIDGET_DEREGISTERED,
      SidebarWidgetTypes.COMMENTS_PANEL
    );
    this.props.emitter.off(SidebarEventTypes.INIT_COMMENTS_PANEL);
    this.props.emitter.off(SidebarEventTypes.UPDATED_COMMENTS_PANEL);
  }

  render() {
    const { initialized, ...panelProps } = this.state;
    return (
      initialized && (
        <CommentsPanel
          {...panelProps}
          isVisible={this.props.isVisible}
          onCommentsCountUpdate={this.onCommentsCountUpdate}
        />
      )
    );
  }
}
