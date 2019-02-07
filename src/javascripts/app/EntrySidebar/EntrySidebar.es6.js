import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EntrySidebarWidget from './EntrySidebarWidget.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';

import {
  getEntryConfiguration,
  getAssetConfiguration
} from './Configuration/service/SidebarSync.es6';

import PublicationWidgetContainer from './PublicationWidget/PublicationWidgetContainer.es6';
import ContentPreviewWidget from './ContentPreviewWidget/ContentPreviewWidget.es6';
import IncomingLinksWidgetContainer from './IncomingLinksWidget/IncomingLinksWidgetContainer.es6';
import TranslationWidgetContainer from './TranslationWidget/TranslationWidgetContainer.es6';
import UsersWidgetContainer from './UsersWidget/UsersWidgetContainer.es6';
import VersionsWidgetContainer from './VersionsWidget/VersionsWidgetContainer.es6';
import SidebarWidgetTypes from './SidebarWidgetTypes.es6';
import EntryInfoPanelContainer from './EntryInfoPanel/EntryInfoPanelContainer.es6';

import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';

const ComponentsMap = {
  [SidebarWidgetTypes.PUBLICATION]: PublicationWidgetContainer,
  [SidebarWidgetTypes.CONTENT_PREVIEW]: ContentPreviewWidget,
  [SidebarWidgetTypes.INCOMING_LINKS]: IncomingLinksWidgetContainer,
  [SidebarWidgetTypes.TRANSLATION]: TranslationWidgetContainer,
  [SidebarWidgetTypes.USERS]: UsersWidgetContainer,
  [SidebarWidgetTypes.VERSIONS]: VersionsWidgetContainer
};

const WidgetsFetcher = createFetcherComponent(({ isEntry, contentTypeId }) => {
  return isEntry ? getEntryConfiguration(contentTypeId) : getAssetConfiguration();
});

export default class EntrySidebar extends Component {
  static propTypes = {
    isMasterEnvironment: PropTypes.bool.isRequired,
    isEntry: PropTypes.bool.isRequired,
    emitter: PropTypes.object.isRequired,
    contentTypeId: PropTypes.string,
    legacySidebar: PropTypes.shape({
      extensions: PropTypes.arrayOf(
        PropTypes.shape({
          bridge: PropTypes.object.isRequired,
          widget: PropTypes.object.isRequired
        })
      ).isRequired,
      appDomain: PropTypes.string.isRequired
    })
  };

  renderWidgets = (widgets = []) => {
    return widgets.map(({ widgetId }) => {
      if (widgetId === SidebarWidgetTypes.VERSIONS && !this.props.isMasterEnvironment) {
        return null;
      }
      if (!ComponentsMap[widgetId]) {
        return null;
      }
      const Component = ComponentsMap[widgetId];
      return <Component key={widgetId} emitter={this.props.emitter} />;
    });
  };

  renderLegacyExtensions = () => {
    return this.props.legacySidebar.extensions.map(({ bridge, widget }) => (
      <EntrySidebarWidget title={widget.field.name} key={widget.field.id}>
        <ExtensionIFrameRenderer
          bridge={bridge}
          src={widget.src}
          srcdoc={widget.srcdoc}
          appDomain={this.props.legacySidebar.appDomain}
        />
      </EntrySidebarWidget>
    ));
  };

  render() {
    return (
      <React.Fragment>
        <EntryInfoPanelContainer emitter={this.props.emitter} />
        <div className="entity-sidebar">
          <WidgetsFetcher isEntry={this.props.isEntry} contentTypeId={this.props.contentTypeId}>
            {({ isLoading, data }) => {
              if (isLoading) {
                return null;
              }
              return (
                <React.Fragment>
                  {this.renderWidgets(data)}
                  {this.renderLegacyExtensions()}
                </React.Fragment>
              );
            }}
          </WidgetsFetcher>
        </div>
      </React.Fragment>
    );
  }
}
