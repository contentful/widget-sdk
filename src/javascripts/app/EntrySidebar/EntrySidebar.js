import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EntrySidebarWidget from './EntrySidebarWidget';
import { isArray } from 'lodash';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note, Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import { AssetConfiguration, EntryConfiguration } from 'app/EntrySidebar/Configuration/defaults';

import PublicationWidgetContainer from './PublicationWidget/PublicationWidgetContainer';
import ReleasesWidgetContainer from '../Releases/ReleasesWidget/ReleasesWidgetContainer';

import TasksWidgetContainer from './TasksWidget/TasksWidgetContainer';
import ContentPreviewWidget from './ContentPreviewWidget/ContentPreviewWidget';
import IncomingLinksWidgetContainer from './IncomingLinksWidget/IncomingLinksWidgetContainer';
import TranslationWidget from './TranslationWidget/TranslationWidget';
import VersionsWidgetContainer from './VersionsWidget/VersionsWidgetContainer';
import SidebarWidgetTypes from './SidebarWidgetTypes';
import EntryInfoPanelContainer from './EntryInfoPanel/EntryInfoPanelContainer';
import CommentsPanelContainer from './CommentsPanel/CommentsPanelContainer';
import {
  WidgetNamespace,
  isCustomWidget,
  WidgetLocation,
  WidgetRenderer,
} from '@contentful/widget-renderer';
import { toRendererWidget } from 'widgets/WidgetCompat';
import { FLAGS, getVariation } from 'core/feature-flags';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { trackIsCommentsAlphaEligible } from './CommentsPanel/analytics';

const styles = {
  activity: css({
    marginTop: `-${tokens.spacingL}`,
  }),
  tabWrapper: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }),
  panelWrapper: css({
    height: '100%',
    overflowY: 'scroll',
    overflowX: 'hidden',
  }),
  tabs: css({
    display: 'flex',
    justifyContent: 'center',
    minHeight: '56px', // TODO: Change Workbench Sidebar design, and remove
  }),
  noteClassName: css({
    marginBottom: tokens.spacingL,
    marginTop: tokens.spacingL,
  }),
  tab: css({
    textAlign: 'center',
  }),
  tabPanel: css({
    display: 'none',
    height: '100%',
    padding: tokens.spacingM,
  }),
  isVisible: css({
    display: 'block',
  }),
};

const ComponentsMap = {
  [SidebarWidgetTypes.PUBLICATION]: PublicationWidgetContainer,
  [SidebarWidgetTypes.RELEASES]: ReleasesWidgetContainer,
  [SidebarWidgetTypes.TASKS]: TasksWidgetContainer,
  [SidebarWidgetTypes.CONTENT_PREVIEW]: ContentPreviewWidget,
  [SidebarWidgetTypes.INCOMING_LINKS]: IncomingLinksWidgetContainer,
  [SidebarWidgetTypes.TRANSLATION]: TranslationWidget,
  // Turned off until CmaDocument.presence is re-implemented
  // [SidebarWidgetTypes.USERS]: UsersWidgetContainer,
  [SidebarWidgetTypes.VERSIONS]: VersionsWidgetContainer,
};

export default class EntrySidebar extends Component {
  static contextType = SpaceEnvContext;

  static propTypes = {
    entrySidebarProps: PropTypes.shape({
      isMasterEnvironment: PropTypes.bool.isRequired,
      isEntry: PropTypes.bool.isRequired,
      emitter: PropTypes.object.isRequired,

      sidebar: PropTypes.arrayOf(
        PropTypes.shape({
          widgetId: PropTypes.string.isRequired,
          widgetNamespace: PropTypes.string.isRequired,
          disabled: PropTypes.bool,
        })
      ),
      sidebarExtensions: PropTypes.arrayOf(
        PropTypes.shape({
          widgetId: PropTypes.string.isRequired,
          widgetNamespace: PropTypes.string.isRequired,
          descriptor: PropTypes.object,
          problem: PropTypes.string,
        })
      ),
      makeSidebarWidgetSDK: PropTypes.func.isRequired,
      legacySidebarExtensions: PropTypes.arrayOf(
        PropTypes.shape({
          makeSdk: PropTypes.func.isRequired,
          widget: PropTypes.object.isRequired,
          field: PropTypes.object.isRequired,
        })
      ),
      localeData: PropTypes.object.isRequired,
      entityInfo: PropTypes.object.isRequired,
    }),
    disableComments: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    commentsEnabled: true,
    disableComments: false,
  };

  entitySidebarRef = React.createRef();

  onCommentsCountUpdate = (commentsCount) => this.setState({ commentsCount });

  createTabs = () => {
    const { commentsEnabled, commentsCount, selectedTab } = this.state;
    const { entrySidebarProps } = this.props;

    const sidebarItems = this.getSidebarConfiguration();
    const legacyExtensions = entrySidebarProps.legacySidebarExtensions || [];

    const onSelect = (id) => {
      this.setState({ selectedTab: id });
    };

    return {
      activity: {
        isEnabled: true,
        title: 'General',
        onSelect,
        children: (
          <div className={styles.activity} data-test-id="entry-editor-sidebar">
            {this.renderWidgets(sidebarItems)}
            {this.renderLegacyExtensions(legacyExtensions)}
          </div>
        ),
      },
      comments: {
        isEnabled: commentsEnabled,
        title: (
          <div>
            <span>
              {commentsCount
                ? `${commentsCount} comment${commentsCount === 1 ? '' : 's'}`
                : 'Comments'}
            </span>
          </div>
        ),
        onSelect,
        children: (
          <CommentsPanelContainer
            emitter={entrySidebarProps.emitter}
            entryId={entrySidebarProps.entityInfo.id}
            isVisible={selectedTab === 'comments'}
            onCommentsCountUpdate={this.onCommentsCountUpdate}
          />
        ),
      },
      info: {
        isEnabled: true,
        title: 'Info',
        onSelect,
        children: <EntryInfoPanelContainer emitter={entrySidebarProps.emitter} />,
      },
    };
  };

  state = {
    selectedTab: 'activity',
    commentsEnabled: undefined,
    commentsCount: undefined,
  };

  componentDidMount() {
    const { disableComments } = this.props;
    if (!disableComments) {
      const { currentSpaceId, currentOrganizationId } = this.context;
      getVariation(FLAGS.ENTRY_COMMENTS, {
        organizationId: currentOrganizationId,
        spaceId: currentSpaceId,
      }).then((commentsEnabled) => {
        if (commentsEnabled) {
          this.setState({ commentsEnabled });
          trackIsCommentsAlphaEligible();
        }
      });
    }
  }

  componentDidUpdate(_, prevState) {
    if (prevState.selectedTab !== this.state.selectedTab) {
      try {
        this.entitySidebarRef.current.scrollTo(0, 0);
      } catch {
        // Edge 44.18362
        this.entitySidebarRef.current.scrollTop = 0;
      }
    }
  }

  renderBuiltinWidget = (sidebarItem) => {
    const { emitter, localeData } = this.props.entrySidebarProps;
    const { widgetId, widgetNamespace } = sidebarItem;
    const defaultProps = { emitter };

    if (
      widgetId === SidebarWidgetTypes.VERSIONS &&
      !this.props.entrySidebarProps.isMasterEnvironment
    ) {
      return null;
    }

    const Component = ComponentsMap[widgetId];

    if (!Component) {
      return null;
    }

    const props =
      widgetId === SidebarWidgetTypes.TRANSLATION ? { ...defaultProps, localeData } : defaultProps;

    return <Component {...props} key={`${widgetNamespace},${widgetId}`} />;
  };

  renderCustomWidget = (item) => {
    // Custom widgets are only supported for entries.
    if (!this.props.entrySidebarProps.isEntry) {
      return null;
    }

    item = this.props.entrySidebarProps.sidebarExtensions.find((w) => {
      return w.widgetNamespace === w.widgetNamespace && w.widgetId === item.widgetId;
    });

    if (item.problem) {
      return (
        <EntrySidebarWidget title="Missing widget">
          <Note noteType="warning" className={styles.noteClassName}>
            <code>{item.name || item.widgetId}</code> is saved in configuration, but not installed
            in this environment.
          </Note>
        </EntrySidebarWidget>
      );
    }

    const widget = toRendererWidget(item.descriptor);

    const sdk = this.props.entrySidebarProps.makeSidebarWidgetSDK(
      item.widgetNamespace,
      item.widgetId,
      item.parameters
    );

    return (
      <EntrySidebarWidget
        title={item.descriptor.name}
        key={`${item.widgetNamespace},${item.widgetId}`}>
        <WidgetRenderer location={WidgetLocation.ENTRY_SIDEBAR} sdk={sdk} widget={widget} />
      </EntrySidebarWidget>
    );
  };

  renderWidgets = (sidebarItems = []) => {
    return sidebarItems.map((item) => {
      if (item.widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN) {
        return this.renderBuiltinWidget(item);
      }
      if (isCustomWidget(item.widgetNamespace)) {
        return this.renderCustomWidget(item);
      }
      return null;
    });
  };

  renderLegacyExtensions = (legacyExtensions) => {
    return legacyExtensions.map(({ makeSdk, widget, field }) => (
      <EntrySidebarWidget title={field.name} key={field.id}>
        <WidgetRenderer
          location={WidgetLocation.ENTRY_FIELD_SIDEBAR}
          sdk={makeSdk()}
          widget={widget}
        />
      </EntrySidebarWidget>
    ));
  };

  getSidebarConfiguration = () => {
    if (!this.props.entrySidebarProps.isEntry) {
      return AssetConfiguration;
    }
    if (!isArray(this.props.entrySidebarProps.sidebar)) {
      return EntryConfiguration;
    }
    return this.props.entrySidebarProps.sidebar.filter((widget) => widget.disabled !== true);
  };

  render() {
    const { selectedTab } = this.state;
    const tabs = Object.entries(this.createTabs());

    return (
      <React.Fragment>
        <div className={styles.tabWrapper}>
          <Tabs className={styles.tabs} withDivider>
            {tabs.map(
              ([key, { isEnabled, onSelect, title }]) =>
                isEnabled && (
                  <Tab
                    key={key}
                    id={key}
                    selected={selectedTab === key}
                    className={styles.tab}
                    onSelect={onSelect}>
                    {title}
                  </Tab>
                )
            )}
          </Tabs>
          <div className={cx('entity-sidebar', styles.panelWrapper)} ref={this.entitySidebarRef}>
            {tabs.map(
              ([key, { isEnabled, children }]) =>
                isEnabled && (
                  <TabPanel
                    key={key}
                    id={key}
                    className={cx(styles.tabPanel, {
                      [styles.isVisible]: selectedTab === key,
                    })}>
                    {children}
                  </TabPanel>
                )
            )}
          </div>
        </div>
      </React.Fragment>
    );
  }
}
