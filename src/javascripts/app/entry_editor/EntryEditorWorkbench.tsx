import React, { useEffect, useState, useContext } from 'react';
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
import { referenceText } from 'app/entry_editor/EntryReferences/utils';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import { track } from 'analytics/Analytics';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { useTagsFeatureEnabled } from 'features/content-tags';
import * as Config from 'Config';
import { DefaultEntryEditorTab, DefaultReferenceTab, DefaultTagsTab } from './DefaultEntryEditor';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import { EditorContext, LocaleData } from 'app/entity_editor/EntityField/types';
import { hasLinks } from './EntryReferences';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { styles } from './styles';
import { Action, ReferencesState } from './EntryReferences/state/reducer';
import { filterWidgets, getNoLocalizedFieldsAdviceProps } from './formWidgetsController';
import { useFieldLocaleListeners } from './makeFieldLocaleListeners';
import NoEditorsWarning from './NoEditorsWarning';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getModule } from 'core/NgRegistry';
import { ReleasesLoadingOverlay } from '../Releases/ReleasesLoadingOverlay';

const trackTabOpen = (tab) =>
  track('editor_workbench:tab_open', {
    /* eslint-disable-next-line @typescript-eslint/camelcase */
    tab_name: tab,
  });

interface EntryEditorWorkbenchProps {
  localeData: LocaleData;
  title: string;
  loadEvents: Record<string, any>;
  state: {
    delete: Record<string, any>;
  };
  statusNotificationProps: { entityLabel: any; status: string };
  otDoc: any;
  editorData: {
    entityInfo: {
      id: string;
      type: any;
    };
    entity: {
      data: {
        fields: any[];
      };
    };
    editorsExtensions: any[];
    customEditor: Record<string, any> | undefined;
    fieldControls: {
      form: any[];
      all: any[];
    };
    editorInterface: {
      controls: {
        widgetId: string;
      }[];
    };
  };
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
}

// Is the selected tab available? Do we need to provide a default tab?
function validateTab(tabKey, tabs) {
  if (tabs.some((key) => `${key.widgetNamespace}-${key.widgetId}` === tabKey)) {
    return tabKey;
  }
  return tabs.length ? `${tabs[0].widgetNamespace}-${tabs[0].widgetId}` : null;
}

function tabIsDefault(tabKey, tabs) {
  return tabs.length ? tabKey === `${tabs[0].widgetNamespace}-${tabs[0].widgetId}` : true;
}

const EntryEditorWorkbench = (props: EntryEditorWorkbenchProps) => {
  const { currentSpaceId, currentEnvironmentId, currentOrganizationId } = useSpaceEnvContext();
  const {
    editorContext,
    editorData,
    entrySidebarProps,
    fields,
    localeData,
    otDoc,
    preferences,
    state,
    statusNotificationProps,
    title,
  } = props;
  const { entityInfo } = editorData;
  const { state: referencesState } = (useContext(ReferencesContext) as unknown) as {
    state: ReferencesState;
    dispatch: React.Dispatch<Action>;
  };
  const { processingAction, references, selectedEntities } = referencesState;
  const [hasReferenceTabBeenClicked, setHasReferenceTabBeenClicked] = useState(false);

  const availableTabs = React.useMemo(
    () => editorData.editorsExtensions.filter((editor) => !editor.disabled && !editor.problem),
    [editorData.editorsExtensions]
  );

  const [selectedTab, setSelectedTab] = useState(() => validateTab(preferences.tab, availableTabs));
  const [tabVisible, setTabVisible] = useState({ entryReferences: false });

  // kill this with fire when react migration allows it
  const $state = getModule('$state');

  const setTabInUrl = React.useCallback(
    (tab) =>
      $state.transitionTo(
        $state.current,
        { tab: tabIsDefault(tab, availableTabs) ? null : tab },
        {
          location: true, // This makes it update URL
          inherit: true,
          relative: $state.$current,
          notify: false, // This controls reload
        }
      ),
    [availableTabs, $state]
  );

  const navigateToTab = React.useCallback(
    (tab) => {
      setTabInUrl(tab);
      setSelectedTab(tab);
    },
    [setTabInUrl]
  );

  const widgets = React.useMemo(() => {
    return filterWidgets(
      localeData,
      editorContext,
      editorData.fieldControls.form,
      preferences.showDisabledFields
    );
  }, [localeData, editorContext, editorData.fieldControls.form, preferences.showDisabledFields]);

  const noLocalizedFieldsAdviceProps = getNoLocalizedFieldsAdviceProps(widgets, localeData);

  useEffect(() => {
    async function getFeatureFlagVariation() {
      const isFeatureEnabled = await getVariation(FLAGS.ALL_REFERENCES_DIALOG, {
        organizationId: currentOrganizationId,
        spaceId: currentSpaceId,
        environmentId: currentEnvironmentId,
      });
      setTabVisible({ entryReferences: isFeatureEnabled });
    }

    getFeatureFlagVariation();
  }, [currentEnvironmentId, currentOrganizationId, currentSpaceId, setTabVisible]);

  const fieldLocaleListeners = useFieldLocaleListeners(
    editorData.fieldControls.all,
    editorContext,
    localeData.privateLocales,
    localeData.defaultLocale,
    otDoc
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
          if (currentTab.widgetId === EntryEditorWidgetTypes.DEFAULT_EDITOR.id) {
            return (
              <DefaultEntryEditorTab
                {...{
                  widgets,
                  noLocalizedFieldsAdviceProps,
                  fieldLocaleListeners,
                  localeData,
                  loadEvents: props.loadEvents,
                  fields: props.fields,
                  otDoc: props.otDoc,
                  editorData: props.editorData,
                  editorContext: props.editorContext,
                  preferences,
                }}
              />
            );
          }
          if (currentTab.widgetId === EntryEditorWidgetTypes.TAGS_EDITOR.id) {
            return (
              <DefaultTagsTab
                {...{
                  widgetId: currentTab.widgetId,
                  selectedTab,
                  otDoc,
                }}
              />
            );
          }
          if (currentTab.widgetId === EntryEditorWidgetTypes.REFERENCE_TREE.id) {
            return (
              <DefaultReferenceTab
                {...{
                  widgetId: currentTab.widgetId,
                  selectedTab,
                  editorData: props.editorData,
                  onRootReferenceCardClick: () => {
                    navigateToTab(validateTab(null, availableTabs));
                  },
                }}
              />
            );
          }
          return null;
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
        navigateToTab(selectedTab);
        trackTabOpen(selectedTab);
        selectedTab.includes(EntryEditorWidgetTypes.REFERENCE_TREE.id) &&
          setHasReferenceTabBeenClicked(true);
      },
    };
  });

  const referencesTab =
    selectedTab?.includes(EntryEditorWidgetTypes.REFERENCE_TREE.id) && tabVisible.entryReferences;

  const visibleTabs = tabs.filter(({ isVisible }) => isVisible);

  const onBack = async () => {
    await setTabInUrl(null);
    goToPreviousSlideOrExit('arrow_back');
  };

  return (
    <div className="entry-editor">
      <Workbench>
        <Workbench.Header
          onBack={onBack}
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
                otDoc={otDoc}
                editorData={editorData}
                preferences={preferences}
                onDelete={state.delete}
              />
            </>
          }
        />
        <Workbench.Content
          type={editorData.customEditor ? 'full' : 'default'}
          className={styles.mainContent}>
          {processingAction && (
            <ReleasesLoadingOverlay
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
                  <Tag tagType="primary-filled" size="small" className={styles.promotionTag}>
                    new
                  </Tag>
                )}
              </Tab>
            ))}
          </Tabs>
          <StatusNotification {...statusNotificationProps} />
          {visibleTabs.length <= 0 ? (
            <NoEditorsWarning contentTypeId={editorContext.entityInfo.contentType?.sys.id} />
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
            {entrySidebarProps && <EntrySidebar entrySidebarProps={entrySidebarProps} />}
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
