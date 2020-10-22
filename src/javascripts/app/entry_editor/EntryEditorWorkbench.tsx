import React, { useEffect, useMemo, useState, useContext } from 'react';
import { cx } from 'emotion';
import { Icon, Tab, TabPanel, Tabs, Tag, Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
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
import { useTagsFeatureEnabled } from 'features/content-tags';
import * as Config from 'Config';
import renderDefaultEditor from './DefaultEntryEditor';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import { EditorContext, LocaleData } from 'app/entity_editor/EntityField/types';
import { hasLinks } from './EntryReferences';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { styles } from './styles';
import { Action, ReferencesState } from './EntryReferences/state/reducer';
import { filterWidgets } from './formWidgetsController';
import { makeFieldLocaleListeners } from './makeFieldLocaleListeners';
import NoEditorsWarning from './NoEditorsWarning';

const trackTabOpen = (tab) =>
  track('editor_workbench:tab_open', {
    /* eslint-disable-next-line @typescript-eslint/camelcase */
    tab_name: tab,
  });

interface EntryEditorWorkbenchProps {
  localeData: LocaleData;
  title: string;
  entityInfo: {
    id: string;
    type: any;
  };
  entryActions: Record<string, any>;
  loadEvents: Record<string, any>;
  state: {
    delete: Record<string, any>;
  };
  getSpace: Function;
  statusNotificationProps: { entityLabel: any; status: string };
  getOtDoc: Function;
  getEditorData: Function;
  editorContext: EditorContext;
  entrySidebarProps: {
    isMasterEnvironment: boolean;
    isEntry: boolean;
    emitter: Record<string, any>;
    makeSidebarWidgetSDK: any;
    localeData: LocaleData;
    entityInfo: any;
    sidebar?: any[];
    sidebarExtensions?: any[];
    legacySidebarExtensions?: any[];
  };
  preferences: Record<string, any>;
  fields: Record<string, any>;
  noLocalizedFieldsAdviceProps: any;
}

const EntryEditorWorkbench = (props: EntryEditorWorkbenchProps) => {
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
    editorContext,
    entrySidebarProps,
    preferences,
    fields,
  } = props;
  const { state: referencesState } = (useContext(ReferencesContext) as unknown) as {
    state: ReferencesState;
    dispatch: React.Dispatch<Action>;
  };
  const { processingAction, references, selectedEntities } = referencesState;
  const [hasReferenceTabBeenClicked, setHasReferenceTabBeenClicked] = useState(false);

  const editorData = getEditorData();
  const otDoc = getOtDoc();
  const availableTabs = editorData.editorsExtensions.filter(
    (editor) => !editor.disabled && !editor.problem
  );
  const defaultTabKey = availableTabs.length
    ? `${availableTabs[0].widgetNamespace}-${availableTabs[0].widgetId}`
    : null;

  const [selectedTab, setSelectedTab] = useState(defaultTabKey);
  const [tabVisible, setTabVisible] = useState({ entryReferences: false });

  const { widgets, shouldDisplayNoLocalizedFieldsAdvice } = filterWidgets(
    localeData,
    editorContext,
    editorData.fieldControls.form,
    preferences.showDisabledFields
  );

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

  const fieldLocaleListeners = useMemo(
    () => makeFieldLocaleListeners(editorData.fieldControls.all, editorContext, localeData, otDoc),
    [editorData.fieldControls.all, editorContext, localeData, otDoc]
  );

  const { tagsEnabled } = useTagsFeatureEnabled();

  const tabs = availableTabs.map((currentTab) => {
    let isTabVisible = true;
    let isTabEnabled = true;

    const isReferenceTab = currentTab.widgetId === EntryEditorWidgetTypes.REFERENCE_TREE.id;
    const isTagsTab = currentTab.widgetId === EntryEditorWidgetTypes.TAGS_EDITOR.id;

    if (isReferenceTab) {
      isTabVisible = tabVisible.entryReferences;
      isTabEnabled = entityInfo.type === 'Entry' && hasLinks(editorData.entity.data.fields);
    }

    if (isTagsTab) {
      if (!tagsEnabled) {
        isTabVisible = false;
        isTabEnabled = false;
      }

      if (otDoc.isOtDocument && Config.env !== 'production') {
        isTabVisible = false;
        isTabEnabled = false;
        // eslint-disable-next-line
        console.log(`enable "${FLAGS.SHAREJS_REMOVAL}" feature flag to show content tags`);
      }
    }

    return {
      key: `${currentTab.widgetNamespace}-${currentTab.widgetId}`,
      title: currentTab.descriptor.name,
      icon: currentTab.descriptor.icon || 'Entry',
      isVisible: isTabVisible,
      isEnabled: () => isTabEnabled,
      render() {
        if (currentTab.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN) {
          return renderDefaultEditor(currentTab.widgetId, {
            selectedTab,
            onRootReferenceCardClick,
            widgets,
            shouldDisplayNoLocalizedFieldsAdvice,
            fieldLocaleListeners,
            ...props,
          });
        } else {
          const scope = {
            editorData,
            editorContext,
            entityInfo,
            otDoc,
            localeData,
            preferences,
            fields,
            widgets,
            fieldLocaleListeners,
          };

          return <CustomEditorExtensionRenderer extension={currentTab} scope={scope} />;
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

  const referencesTab =
    selectedTab?.includes(EntryEditorWidgetTypes.REFERENCE_TREE.id) && tabVisible.entryReferences;

  if (!editorContext) return null;

  const visibleTabs = tabs.filter(({ isVisible }) => isVisible);

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
              contentTypeName={editorContext.entityInfo.contentType?.name}
              entityInfo={entityInfo}
            />
          }
          icon={<ProductIcon icon="Content" size="xlarge" />}
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
            {visibleTabs.map((tab) => (
              <Tab
                id={tab.key}
                key={tab.key}
                testId={`test-id-${tab.key}`}
                disabled={!tab.isEnabled()}
                selected={selectedTab === tab.key}
                className={cx(styles.tab, {
                  // the class name is to provide a hook to attach intercom product tours
                  [`tab-${tab.key}--enabled`]: tab.isEnabled(),
                })}
                onSelect={tab.onClick}>
                <Icon icon={tab.icon} color="muted" className={styles.tabIcon} />
                {tab.title}
                {tab.key ===
                  `${WidgetNamespace.EDITOR_BUILTIN}-${EntryEditorWidgetTypes.TAGS_EDITOR.id}` && (
                  <Tag className={styles.promotionTag}>new</Tag>
                )}
              </Tab>
            ))}
          </Tabs>
          <StatusNotification {...statusNotificationProps} />
          {visibleTabs.length <= 0 ? (
            <NoEditorsWarning contentTypeId={props.editorContext.entityInfo.contentType?.sys.id} />
          ) : (
            visibleTabs.map((tab) => (
              <TabPanel
                id={tab.key}
                key={tab.key}
                className={cx(styles.tabPanel, { [styles.isVisible]: selectedTab === tab.key })}>
                {tab.render()}
              </TabPanel>
            ))
          )}
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
            <EntrySidebar entrySidebarProps={entrySidebarProps} />
          </Workbench.Sidebar>
        </div>
      </Workbench>
    </div>
  );
};

const EntryEditorWorkbenchWithProvider = (props: EntryEditorWorkbenchProps) => (
  <ReferencesProvider>
    <EntryEditorWorkbench {...props} />
  </ReferencesProvider>
);

export default EntryEditorWorkbenchWithProvider;
