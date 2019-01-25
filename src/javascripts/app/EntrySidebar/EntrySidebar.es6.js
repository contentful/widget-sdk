import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EntrySidebarWidget from './EntrySidebarWidget.es6';

import PublicationWidgetContainer from './PublicationWidget/PublicationWidgetContainer.es6';
import ContentPreviewWidget from './ContentPreviewWidget/ContentPreviewWidget.es6';
import IncomingLinksWidgetContainer from './IncomingLinksWidget/IncomingLinksWidgetContainer.es6';
import TranslationWidgetContainer from './TranslationWidget/TranslationWidgetContainer.es6';
import UsersWidgetContainer from './UsersWidget/UsersWidgetContainer.es6';
import VersionsWidgetContainer from './VersionsWidget/VersionsWidgetContainer.es6';
import SidebarWidgetTypes from './SidebarWidgetTypes.es6';
import EntryInfoPanelContainer from './EntryInfoPanel/EntryInfoPanelContainer.es6';

import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';

const CORE_WIDGETS = {
  PUBLICATION: {
    type: SidebarWidgetTypes.PUBLICATION,
    Component: PublicationWidgetContainer
  },
  CONTENT_PREVIEW: {
    type: SidebarWidgetTypes.CONTENT_PREVIEW,
    Component: ContentPreviewWidget
  },
  INCOMING_LINKS: {
    type: SidebarWidgetTypes.INCOMING_LINKS,
    Component: IncomingLinksWidgetContainer
  },
  TRANSLATION: {
    type: SidebarWidgetTypes.TRANSLATION,
    Component: TranslationWidgetContainer
  },
  VERSIONS: {
    type: SidebarWidgetTypes.VERSIONS,
    Component: VersionsWidgetContainer
  },
  USERS: {
    type: SidebarWidgetTypes.USERS,
    Component: UsersWidgetContainer
  }
};

export default class EntrySidebar extends Component {
  static propTypes = {
    isMasterEnvironment: PropTypes.bool.isRequired,
    isEntry: PropTypes.bool.isRequired,
    emitter: PropTypes.object.isRequired,
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

  getWidgetsList = () => {
    const { isEntry, isMasterEnvironment } = this.props;
    return [
      CORE_WIDGETS.PUBLICATION,
      isEntry ? CORE_WIDGETS.CONTENT_PREVIEW : null,
      CORE_WIDGETS.INCOMING_LINKS,
      CORE_WIDGETS.TRANSLATION,
      isEntry && isMasterEnvironment ? CORE_WIDGETS.VERSIONS : null,
      CORE_WIDGETS.USERS
    ].filter(item => item !== null);
  };

  render() {
    const widgets = this.getWidgetsList();
    return (
      <React.Fragment>
        <EntryInfoPanelContainer emitter={this.props.emitter} />
        <div className="entity-sidebar">
          {widgets.map(({ type, Component }) => (
            <Component key={type} emitter={this.props.emitter} />
          ))}

          {this.props.legacySidebar.extensions.map(({ bridge, widget }) => (
            <EntrySidebarWidget title={widget.field.name} key={widget.field.id}>
              <ExtensionIFrameRenderer
                bridge={bridge}
                src={widget.src}
                srcdoc={widget.srcdoc}
                appDomain={this.props.legacySidebar.appDomain}
              />
            </EntrySidebarWidget>
          ))}
        </div>
      </React.Fragment>
    );
  }
}
