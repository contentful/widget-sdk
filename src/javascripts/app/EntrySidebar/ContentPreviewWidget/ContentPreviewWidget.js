import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes';
import SidebarWidgetTypes from '../SidebarWidgetTypes';
import NetlifyBuildButton from 'app/settings/apps/netlify/BuildButton';
import SidebarContentPreviewContainer from './SidebarContentPreviewContainer';
import EntrySidebarWidget from '../EntrySidebarWidget';

export default class ContentPreviewWidget extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    isInitialized: false,
    data: {}
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_CONTENT_PREVIEW_WIDGET, this.onUpdatePreview);
    this.props.emitter.emit(
      SidebarEventTypes.WIDGET_REGISTERED,
      SidebarWidgetTypes.CONTENT_PREVIEW
    );
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_CONTENT_PREVIEW_WIDGET, this.onUpdatePreview);
  }

  onUpdatePreview = data => {
    this.setState({ isInitialized: true, data });
  };

  render() {
    return (
      <EntrySidebarWidget title="Preview">
        {this.state.isInitialized && (
          <React.Fragment>
            <NetlifyBuildButton {...this.state.data} />
            <SidebarContentPreviewContainer {...this.state.data} />
          </React.Fragment>
        )}
      </EntrySidebarWidget>
    );
  }
}
