import React, { useEffect, useMemo, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { cx } from 'emotion';
import { Icon, Tab, TabPanel, Tabs, Tag, Workbench } from '@contentful/forma-36-react-components';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import EntrySecondaryActions from 'app/entry_editor/EntryTitlebar/EntrySecondaryActions/EntrySecondaryActions';
import StatusNotification from 'app/entity_editor/StatusNotification';
import CustomEditorExtensionRenderer from 'app/entry_editor/CustomEditorExtensionRenderer';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import ReferencesSideBar from 'app/entry_editor/EntryReferences/ReferencesSideBar';
import {
  ReferencesProvider,
  ReferencesContext,
} from 'app/entry_editor/EntryReferences/ReferencesContext';
import LoadingOverlay from 'app/common/LoadingOverlay';
import { referenceText } from 'app/entry_editor/EntryReferences/utils';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import { track } from 'analytics/Analytics';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { ContentTagsTab } from './EntryContentTags/ContentTagsTab';
import { useTagsFeatureEnabled } from 'features/content-tags';
import * as Config from 'Config';
import renderDefaultEditor from './DefaultEntryEditor';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import { hasLinks } from './EntryReferences';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { styles } from './styles';

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
  const { state: referencesState } = useContext(ReferencesContext);
  const { processingAction, references, selectedEntities } = referencesState;
  const [hasReferenceTabBeenClicked, setHasReferenceTabBeenClicked] = useState(false);

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

  const onRootReferenceCardClick = () => setSelectedTab(defaultTabKey);

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
          return renderDefaultEditor(currentTab.widgetId, {
            tabVisible,
            selectedTab,
            onRootReferenceCardClick,
            ...props,
          });
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
        selectedTab.includes(EntryEditorWidgetTypes.REFERENCE_TREE.id) &&
          setHasReferenceTabBeenClicked(true);
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

  const referencesTab = selectedTab.includes(EntryEditorWidgetTypes.REFERENCE_TREE.id);

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
          {processingAction && (
            <LoadingOverlay
              message={`${processingAction} ${referenceText(selectedEntities, references, title)}`}
            />
          )}
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
        <div>
          <Workbench.Sidebar
            position="right"
            className={cx(styles.sidebar, styles.referenceSideBar, {
              [styles.sidebarSlideIn]: referencesTab,
              [styles.sideBarSlideOut]: !referencesTab && hasReferenceTabBeenClicked,
            })}>
            <ReferencesSideBar entity={editorData.entity.data} entityTitle={title} />
          </Workbench.Sidebar>
          <Workbench.Sidebar position="right" className={styles.sidebar}>
            <EntrySidebar
              entrySidebarProps={entrySidebarProps}
              sidebarToggleProps={sidebarToggleProps}
            />
          </Workbench.Sidebar>
        </div>
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
  fieldLocaleListeners: PropTypes.shape({
    flat: PropTypes.array,
    lookup: PropTypes.object,
  }),
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
