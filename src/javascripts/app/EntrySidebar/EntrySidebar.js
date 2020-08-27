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
import UsersWidgetContainer from './UsersWidget/UsersWidgetContainer';
import VersionsWidgetContainer from './VersionsWidget/VersionsWidgetContainer';
import SidebarWidgetTypes from './SidebarWidgetTypes';
import EntryInfoPanelContainer from './EntryInfoPanel/EntryInfoPanelContainer';
import { ExtensionIFrameRendererWithLocalHostWarning } from 'widgets/ExtensionIFrameRenderer';
import CommentsPanelContainer from './CommentsPanel/CommentsPanelContainer';
import { WidgetNamespace, isCustomWidget } from '@contentful/widget-renderer';
import { toRendererWidget } from 'widgets/WidgetCompat';

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
  [SidebarWidgetTypes.USERS]: UsersWidgetContainer,
  [SidebarWidgetTypes.VERSIONS]: VersionsWidgetContainer,
};

export default class EntrySidebar extends Component {
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
      buildSidebarExtensionsBridge: PropTypes.func.isRequired,
      legacySidebarExtensions: PropTypes.arrayOf(
        PropTypes.shape({
          bridge: PropTypes.object.isRequired,
          widget: PropTypes.object.isRequired,
        })
      ),
      localeData: PropTypes.object.isRequired,
    }),
    sidebarToggleProps: PropTypes.shape({
      commentsToggle: PropTypes.shape({
        onClick: PropTypes.func,
        isEnabled: PropTypes.bool,
        commentsCount: PropTypes.number,
      }),
    }),
  };

  entitySidebarRef = React.createRef();

  createTabs = () => ({
    activity: {
      isEnabled: true,
      title: 'General',
      onClick: (id) => {
        this.setState({ selectedTab: id });
      },
    },
    comments: {
      isEnabled: this.props.sidebarToggleProps.commentsToggle.isEnabled,
      title: (
        <div>
          <span>
            {this.props.sidebarToggleProps.commentsToggle.commentsCount
              ? this.props.sidebarToggleProps.commentsToggle.commentsCount === 1
                ? '1 comment'
                : `${this.props.sidebarToggleProps.commentsToggle.commentsCount} comments`
              : 'Comments'}
          </span>
        </div>
      ),
      onClick: (id) => {
        this.props.sidebarToggleProps.commentsToggle.onClick();
        this.setState({ selectedTab: id });
      },
    },
    info: {
      isEnabled: true,
      title: 'Info',
      onClick: (id) => {
        this.setState({ selectedTab: id });
      },
    },
  });

  state = {
    selectedTab: Object.keys(this.createTabs())[0],
  };

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
    const { emitter, localeData, buildSidebarExtensionsBridge } = this.props.entrySidebarProps;
    const { widgetId, widgetNamespace } = sidebarItem;
    const defaultProps = {
      emitter,
      bridge: buildSidebarExtensionsBridge(widgetId, widgetNamespace),
    };

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

  renderExtensionWidget = (item) => {
    item = this.props.entrySidebarProps.sidebarExtensions.find((w) => {
      return w.widgetNamespace === w.widgetNamespace && w.widgetId === item.widgetId;
    });

    if (item.problem) {
      return (
        <EntrySidebarWidget title="Missing extension">
          <Note noteType="warning" className={styles.noteClassName}>
            <code>{item.name || item.widgetId}</code> is saved in configuration, but not installed
            in this environment.
          </Note>
        </EntrySidebarWidget>
      );
    }

    return (
      <EntrySidebarWidget
        title={item.descriptor.name}
        key={`${item.widgetNamespace},${item.widgetId}`}>
        <ExtensionIFrameRendererWithLocalHostWarning
          bridge={this.props.entrySidebarProps.buildSidebarExtensionsBridge(
            item.widgetId,
            item.widgetNamespace
          )}
          widget={toRendererWidget(item.descriptor)}
          parameters={item.parameters}
        />
      </EntrySidebarWidget>
    );
  };

  renderWidgets = (sidebarItems = []) => {
    return sidebarItems.map((item) => {
      if (item.widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN) {
        return this.renderBuiltinWidget(item);
      }
      if (isCustomWidget(item.widgetNamespace)) {
        return this.renderExtensionWidget(item);
      }
      return null;
    });
  };

  renderLegacyExtensions = (legacyExtensions) => {
    return legacyExtensions.map(({ bridge, widget }) => (
      <EntrySidebarWidget title={widget.field.name} key={widget.field.id}>
        <ExtensionIFrameRendererWithLocalHostWarning
          bridge={bridge}
          widget={toRendererWidget(widget.descriptor)}
          parameters={widget.parameters}
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
    const sidebarItems = this.getSidebarConfiguration();
    const legacyExtensions = this.props.entrySidebarProps.legacySidebarExtensions || [];
    const tabs = this.createTabs();
    return (
      <React.Fragment>
        <div className={styles.tabWrapper}>
          <Tabs className={styles.tabs} withDivider>
            {Object.keys(tabs).map(
              (key) =>
                tabs[key].isEnabled && (
                  <Tab
                    id={key}
                    selected={this.state.selectedTab === key}
                    key={key}
                    className={styles.tab}
                    onSelect={tabs[key].onClick}>
                    {tabs[key].title}
                  </Tab>
                )
            )}
          </Tabs>
          <div className={cx('entity-sidebar', styles.panelWrapper)} ref={this.entitySidebarRef}>
            <TabPanel
              id="comments"
              className={cx(styles.tabPanel, {
                [styles.isVisible]: this.state.selectedTab === 'comments',
              })}>
              <CommentsPanelContainer
                emitter={this.props.entrySidebarProps.emitter}
                isVisible={this.state.selectedTab === 'comments'}
              />
            </TabPanel>
            <TabPanel
              id="info"
              className={cx(styles.tabPanel, {
                [styles.isVisible]: this.state.selectedTab === 'info',
              })}>
              <EntryInfoPanelContainer emitter={this.props.entrySidebarProps.emitter} />
            </TabPanel>
            <TabPanel
              id="activity"
              className={cx(styles.tabPanel, {
                [styles.isVisible]: this.state.selectedTab === 'activity',
              })}>
              <div className={styles.activity} data-test-id="entry-editor-sidebar">
                {this.renderWidgets(sidebarItems)}
                {this.renderLegacyExtensions(legacyExtensions)}
              </div>
            </TabPanel>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
