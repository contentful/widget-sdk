import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EntrySidebarWidget from './EntrySidebarWidget.es6';
import { isArray } from 'lodash';

import {
  AssetConfiguration,
  EntryConfiguration
} from 'app/EntrySidebar/Configuration/defaults.es6';
import { NAMESPACE_SIDEBAR_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

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

export default class EntrySidebar extends Component {
  static propTypes = {
    isMasterEnvironment: PropTypes.bool.isRequired,
    isEntry: PropTypes.bool.isRequired,
    emitter: PropTypes.object.isRequired,

    sidebar: PropTypes.arrayOf(
      PropTypes.shape({
        widgetId: PropTypes.string.isRequired,
        widgetNamespace: PropTypes.string.isRequired,
        disabled: PropTypes.bool
      })
    ),
    appDomain: PropTypes.string.isRequired,
    sidebarExtensions: PropTypes.arrayOf(
      PropTypes.shape({
        bridge: PropTypes.object.isRequired,
        widget: PropTypes.object.isRequired
      })
    ),
    legacySidebarExtensions: PropTypes.arrayOf(
      PropTypes.shape({
        bridge: PropTypes.object.isRequired,
        widget: PropTypes.object.isRequired
      })
    )
  };

  renderBuiltinWidget = widget => {
    const { widgetId, widgetNamespace } = widget;
    if (widgetId === SidebarWidgetTypes.VERSIONS && !this.props.isMasterEnvironment) {
      return null;
    }
    if (!ComponentsMap[widgetId]) {
      return null;
    }
    const Component = ComponentsMap[widgetId];
    return <Component key={`${widgetId}-${widgetNamespace}`} emitter={this.props.emitter} />;
  };

  renderExtensionWidget = widget => {
    const item = this.props.sidebarExtensions.find(item => {
      return item.widget.id == widget.widgetId;
    });

    if (!item) {
      return null;
    }
    return (
      <EntrySidebarWidget title={item.widget.name}>
        <ExtensionIFrameRenderer
          bridge={item.bridge}
          src={item.widget.src}
          srcdoc={item.widget.srcdoc}
          appDomain={this.props.appDomain}
          location="entry-sidebar"
        />
      </EntrySidebarWidget>
    );
  };

  renderWidgets = (widgets = []) => {
    return widgets.map(widget => {
      if (widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
        return this.renderBuiltinWidget(widget);
      }
      if (widget.widgetNamespace === NAMESPACE_EXTENSION) {
        return this.renderExtensionWidget(widget);
      }
      return null;
    });
  };

  renderLegacyExtensions = () => {
    return this.props.legacySidebarExtensions.map(({ bridge, widget }) => (
      <EntrySidebarWidget title={widget.field.name} key={widget.field.id}>
        <ExtensionIFrameRenderer
          bridge={bridge}
          src={widget.src}
          srcdoc={widget.srcdoc}
          appDomain={this.props.appDomain}
        />
      </EntrySidebarWidget>
    ));
  };

  getSidebarConfiguration = () => {
    if (!this.props.isEntry) {
      return AssetConfiguration;
    }
    if (!isArray(this.props.sidebar)) {
      return EntryConfiguration;
    }
    return this.props.sidebar.filter(widget => widget.disabled !== true);
  };

  render() {
    const widgets = this.getSidebarConfiguration();
    return (
      <React.Fragment>
        <EntryInfoPanelContainer emitter={this.props.emitter} />
        <div className="entity-sidebar">
          {this.renderWidgets(widgets)}
          {this.renderLegacyExtensions()}
        </div>
      </React.Fragment>
    );
  }
}
