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
    sidebarExtensions: PropTypes.arrayOf(
      PropTypes.shape({
        widgetId: PropTypes.string.isRequired,
        widgetNamespace: PropTypes.string.isRequired,
        descriptor: PropTypes.object,
        problem: PropTypes.string
      })
    ),
    sidebarExtensionsBridge: PropTypes.object.isRequired,
    legacySidebarExtensions: PropTypes.arrayOf(
      PropTypes.shape({
        bridge: PropTypes.object.isRequired,
        widget: PropTypes.object.isRequired
      })
    )
  };

  renderBuiltinWidget = sidebarItem => {
    const { widgetId, widgetNamespace } = sidebarItem;

    if (widgetId === SidebarWidgetTypes.VERSIONS && !this.props.isMasterEnvironment) {
      return null;
    }

    const Component = ComponentsMap[widgetId];

    if (!Component) {
      return null;
    }

    return <Component key={`${widgetNamespace},${widgetId}`} emitter={this.props.emitter} />;
  };

  renderExtensionWidget = item => {
    item = this.props.sidebarExtensions.find(w => w.widgetId === item.widgetId);

    if (item.problem) {
      return <p>TODO: Render error - missing UIE</p>;
    }

    return (
      <EntrySidebarWidget
        title={item.descriptor.name}
        key={`${item.widgetNamespace},${item.widgetId}`}>
        <ExtensionIFrameRenderer
          bridge={this.props.sidebarExtensionsBridge}
          descriptor={item.descriptor}
        />
      </EntrySidebarWidget>
    );
  };

  renderWidgets = (sidebarItems = []) => {
    return sidebarItems.map(item => {
      if (item.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
        return this.renderBuiltinWidget(item);
      }
      if (item.widgetNamespace === NAMESPACE_EXTENSION) {
        return this.renderExtensionWidget(item);
      }
      return null;
    });
  };

  renderLegacyExtensions = legacyExtensions => {
    return legacyExtensions.map(({ bridge, widget }) => (
      <EntrySidebarWidget title={widget.field.name} key={widget.field.id}>
        <ExtensionIFrameRenderer bridge={bridge} descriptor={widget.descriptor} />
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
    const sidebarItems = this.getSidebarConfiguration();
    const legacyExtensions = this.props.legacySidebarExtensions || [];
    return (
      <React.Fragment>
        <EntryInfoPanelContainer emitter={this.props.emitter} />
        <div className="entity-sidebar">
          {this.renderWidgets(sidebarItems)}
          {this.renderLegacyExtensions(legacyExtensions)}
        </div>
      </React.Fragment>
    );
  }
}
