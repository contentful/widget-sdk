import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import NetlifyBuildButton from 'app/settings/apps/netlify/BuildButton/index.es6';
import SidebarContentPreviewContainer from './SidebarContentPreviewContainer.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';

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
