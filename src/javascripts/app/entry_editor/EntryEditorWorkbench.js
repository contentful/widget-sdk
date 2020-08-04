import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import { Icon, Tab, TabPanel, Tabs, Tag, Workbench } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import EntrySecondaryActions from 'app/entry_editor/EntryTitlebar/EntrySecondaryActions/EntrySecondaryActions';
import StatusNotification from 'app/entity_editor/StatusNotification';
import CustomEditorExtensionRenderer from 'app/entry_editor/CustomEditorExtensionRenderer';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import { track } from 'analytics/Analytics';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { ContentTagsTab } from './EntryContentTags/ContentTagsTab';
import { useTagsFeatureEnabled } from 'features/content-tags';
import * as Config from 'Config';
import renderDefaultEditor from './DefaultEntryEditor';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import { hasLinks } from './EntryReferences';
import { WidgetNamespace } from 'features/widget-renderer';
import ReferencesSideBar from 'app/entry_editor/EntryReferences/ReferencesSideBar';
import { ReferencesProvider } from 'app/entry_editor/EntryReferences/ReferencesContext';

const styles = {
  mainContent: css({
    padding: 0,
    '& > div': {
      height: '100%',
      minHeight: '100%',
      maxWidth: '100%',
    },
  }),
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    padding: '0',
  }),
  tabs: css({
    display: 'flex',
    paddingLeft: tokens.spacing2Xl,
  }),
  tab: css({
    alignItems: 'center',
    display: 'flex',
    textAlign: 'center',
  }),
  tabIcon: css({
    marginRight: tokens.spacing2Xs,
    marginLeft: tokens.spacing2Xs,
  }),
  tabPanel: css({
    display: 'none',
    height: '100%',
    maxHeight: 'calc(100% - 56px)',
    overflowY: 'scroll',
  }),
  isVisible: css({
    display: 'block',
  }),
  promotionTag: css({
    padding: '3px 5px',
    fontSize: '10px',
    lineHeight: '10px',
    letterSpacing: '0.5px',
    fontWeight: tokens.fontWeightMedium,
    borderRadius: '3px',
    backgroundColor: tokens.colorBlueDark,
    marginLeft: tokens.spacingXs,
    color: `${tokens.colorWhite} !important`,
    textTransform: 'uppercase',
  }),
};

const trackTabOpen = (tab) =>
  track('editor_workbench:tab_open', {
    tab_name: tab,
  });

const EntryEditorWorkbench = (props) => {
  const {
    localeData,
    title,
    entityInfo,
    entryActions,
    state,
    getSpace,
    statusNotificationProps,
    getOtDoc,
    getEditorData,
    customExtensionProps,
    editorContext,
    entrySidebarProps,
    sidebarToggleProps,
  } = props;

  const editorData = getEditorData();
  const otDoc = getOtDoc();
  const enabledTabs = editorData.editorsExtensions.filter((editor) => !editor.disabled);
  const defaultTabKey = enabledTabs.length
    ? `${enabledTabs[0].widgetNamespace}-${enabledTabs[0].widgetId}`
    : null;

  const [selectedTab, setSelectedTab] = useState(defaultTabKey);
  const [tabVisible, setTabVisible] = useState({ entryReferences: false });

  useEffect(() => {
    async function getFeatureFlagVariation() {
      const { data: spaceData, environment } = getSpace();

      const isFeatureEnabled = await getVariation(FLAGS.ALL_REFERENCES_DIALOG, {
        organizationId: spaceData.organization.sys.id,
        spaceId: spaceData.sys.id,
        environmentId: environment.sys.id,
      });
      setTabVisible({ entryReferences: isFeatureEnabled });
    }

    getFeatureFlagVariation();
  }, [setTabVisible, getSpace]);

  const tabs = enabledTabs.map((currentTab) => {
    const isReferenceTab = currentTab.widgetId === EntryEditorWidgetTypes.REFERENCE_TREE.id;
    const isReferenceTabVisible = isReferenceTab && tabVisible.entryReferences;
    const isReferenceTabEnabled =
      isReferenceTab && entityInfo.type === 'Entry' && hasLinks(editorData.entity.data.fields);
    const isTabVisible = isReferenceTab ? isReferenceTabVisible : true;
    const isTabEnabled = isReferenceTab ? isReferenceTabEnabled : true;

    return {
      key: `${currentTab.widgetNamespace}-${currentTab.widgetId}`,
      title: currentTab.descriptor.name,
      icon: currentTab.descriptor.icon || 'Entry',
      isVisible: isTabVisible,
      isEnabled: () => isTabEnabled,
      render() {
        if (currentTab.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN) {
          return renderDefaultEditor(currentTab.widgetId, { tabVisible, selectedTab, ...props });
        } else {
          return (
            <CustomEditorExtensionRenderer
              extension={currentTab}
              createBridge={customExtensionProps.createBridge}
            />
          );
        }
      },
      onClick(selectedTab) {
        setSelectedTab(selectedTab);
        trackTabOpen(selectedTab);
      },
    };
  });

  const tagsTab = useMemo(() => {
    return {
      key: 'entryContentTags',
      title: 'Tags',
      icon: 'Tags',
      isVisible: true,
      isEnabled: () => true,
      render() {
        return (
          <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
            {selectedTab === 'entryContentTags' && (
              <ContentTagsTab getValueAt={otDoc.getValueAt} setValueAt={otDoc.setValueAt} />
            )}
          </div>
        );
      },
      onClick(selectedTab) {
        setSelectedTab(selectedTab);
        trackTabOpen(selectedTab);
      },
    };
  }, [selectedTab, setSelectedTab, otDoc]);

  const { tagsEnabled } = useTagsFeatureEnabled();

  if (tagsEnabled) {
    if (otDoc.isOtDocument !== true) {
      tabs.push(tagsTab);
    } else if (Config.env !== 'production') {
      // eslint-disable-next-line
      console.log(`enable "${FLAGS.SHAREJS_REMOVAL}" feature flag to show content tags`);
    }
  }

  return (
    <div className="entry-editor">
      <Workbench>
        <Workbench.Header
          onBack={() => goToPreviousSlideOrExit('arrow_back')}
          title={
            <WorkbenchTitle
              title={title}
              localeName={localeData.focusedLocale.name}
              isSingleLocaleModeOn={localeData.isSingleLocaleModeOn}
              contentTypeName={editorContext.entityInfo.contentType.name}
              entityInfo={entityInfo}
            />
          }
          icon={<NavigationIcon icon="Content" size="xlarge" />}
          actions={
            <>
              <div id={`editor-status-switch-${entityInfo.id}`} />
              <EntrySecondaryActions
                entityInfo={entityInfo}
                entryActions={entryActions}
                onDelete={state.delete}
              />
            </>
          }
        />
        <Workbench.Content
          type={editorData.customEditor ? 'full' : 'default'}
          className={styles.mainContent}>
          <Tabs className={styles.tabs} withDivider>
            {tabs
              .filter((tab) => tab.isVisible)
              .map((tab) => (
                <Tab
                  id={tab.key}
                  key={tab.key}
                  testId={`test-id-${tab.key}`}
                  disabled={!tab.isEnabled()}
                  selected={selectedTab === tab.key}
                  className={styles.tab}
                  onSelect={tab.onClick}>
                  <Icon icon={tab.icon} color="muted" className={styles.tabIcon} />
                  {tab.title}
                  {tab.key === 'entryContentTags' && <Tag className={styles.promotionTag}>new</Tag>}
                </Tab>
              ))}
          </Tabs>
          <StatusNotification {...statusNotificationProps} />
          {tabs
            .filter((tab) => tab.isVisible)
            .map((tab) => (
              <TabPanel
                id={tab.key}
                key={tab.key}
                className={cx(styles.tabPanel, { [styles.isVisible]: selectedTab === tab.key })}>
                {tab.render()}
              </TabPanel>
            ))}
        </Workbench.Content>
        <Workbench.Sidebar position="right" className={styles.sidebar}>
          {selectedTab.includes(EntryEditorWidgetTypes.REFERENCE_TREE.id) ? (
            <ReferencesSideBar entity={editorData.entity.data} entityTitle={title} />
          ) : (
            <EntrySidebar
              entrySidebarProps={entrySidebarProps}
              sidebarToggleProps={sidebarToggleProps}
            />
          )}
        </Workbench.Sidebar>
      </Workbench>
    </div>
  );
};

EntryEditorWorkbench.propTypes = {
  title: PropTypes.string.isRequired,
  localeData: PropTypes.shape({
    focusedLocale: PropTypes.shape({
      name: PropTypes.string,
    }),
    isSingleLocaleModeOn: PropTypes.bool,
  }),
  preferences: PropTypes.object,
  customExtensionProps: PropTypes.object,
  statusNotificationProps: PropTypes.object,
  widgets: PropTypes.array,
  getOtDoc: PropTypes.func,
  shouldDisplayNoLocalizedFieldsAdvice: PropTypes.bool,
  noLocalizedFieldsAdviceProps: PropTypes.object,
  sidebarToggleProps: PropTypes.object,
  entrySidebarProps: PropTypes.object,
  editorContext: PropTypes.shape({
    entityInfo: PropTypes.object,
  }),
  fields: PropTypes.object,
  getEditorData: PropTypes.func,
  getSpace: PropTypes.func,
  state: PropTypes.shape({
    delete: PropTypes.object,
  }),
  entryActions: PropTypes.object,
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
  }),
  loadEvents: PropTypes.object,
};

const EntryEditorWorkbenchWithProvider = (props) => (
  <ReferencesProvider>
    <EntryEditorWorkbench {...props} />
  </ReferencesProvider>
);

export default EntryEditorWorkbenchWithProvider;
