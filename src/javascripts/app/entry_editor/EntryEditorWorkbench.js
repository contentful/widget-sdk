import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import { Icon, Tab, TabPanel, Tabs, Workbench } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import EntrySecondaryActions from 'app/entry_editor/EntryTitlebar/EntrySecondaryActions/EntrySecondaryActions';
import StatusNotification from 'app/entity_editor/StatusNotification';
import CustomEditorExtensionRenderer from 'app/entry_editor/CustomEditorExtensionRenderer';
import NoLocalizedFieldsAdvice from 'components/tabs/NoLocalizedFieldsAdvice';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import AngularComponent from 'ui/Framework/AngularComponent';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import ReferencesTab, { hasLinks } from './EntryReferences';
import { track } from 'analytics/Analytics';
import { getVariation } from 'LaunchDarkly';
import { ALL_REFERENCES_DIALOG, SHAREJS_REMOVAL } from 'featureFlags';

import { ContentTagsTab } from './EntryContentTags/ContentTagsTab';
import { useTagsFeatureEnabled } from 'features/content-tags';
import * as Config from 'Config';

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
    width: '360px',
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
};

const trackTabOpen = (tab) =>
  track('editor_workbench:tab_open', {
    tab_name: tab,
  });

const EntryEditorWorkbench = ({
  localeData,
  loadEvents,
  title,
  fields,
  entityInfo,
  entryActions,
  state,
  getSpace,
  statusNotificationProps,
  getEditorData,
  customExtensionProps,
  preferences,
  widgets,
  editorContext,
  getOtDoc,
  shouldDisplayNoLocalizedFieldsAdvice,
  noLocalizedFieldsAdviceProps,
  entrySidebarProps,
  sidebarToggleProps,
}) => {
  const otDoc = getOtDoc();
  const editorData = getEditorData();

  const [selectedTab, setSelectedTab] = useState('entryEditor');
  const [tabVisible, setTabVisible] = useState({ entryReferences: false });
  useEffect(() => {
    async function getFeatureFlagVariation() {
      const { data: spaceData, environment } = getSpace();

      const isFeatureEnabled = await getVariation(ALL_REFERENCES_DIALOG, {
        organizationId: spaceData.organization.sys.id,
        spaceId: spaceData.sys.id,
        environmentId: environment.sys.id,
      });
      setTabVisible({ entryReferences: isFeatureEnabled });
    }

    getFeatureFlagVariation();
  }, [setTabVisible, getSpace]);

  const tabs = {
    entryEditor: {
      title: 'Entry',
      icon: 'Entry',
      isVisible: true,
      isEnabled: () => true,
      render() {
        return (
          <>
            {editorData.editorExtension && (
              <CustomEditorExtensionRenderer {...customExtensionProps} />
            )}
            {!editorData.editorExtension && (
              <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
                <AngularComponent
                  template={`<cf-error-list
                        className="form-box-error"
                        cf-error-path="['fields']"></cf-error-list>`}
                  scope={{
                    widgets,
                    editorContext,
                    localeData,
                    fields,
                    editorData,
                    otDoc,
                    entityInfo,
                  }}
                />

                <AngularComponent
                  template={
                    '<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId" />'
                  }
                  scope={{
                    widgets,
                    editorContext,
                    localeData,
                    fields,
                    loadEvents,
                    editorData: getEditorData(),
                    otDoc,
                    preferences,
                    entityInfo,
                  }}
                />
                {shouldDisplayNoLocalizedFieldsAdvice && (
                  <NoLocalizedFieldsAdvice {...noLocalizedFieldsAdviceProps} />
                )}
              </div>
            )}
          </>
        );
      },
      onClick(selectedTab) {
        setSelectedTab(selectedTab);
        trackTabOpen(selectedTab);
      },
    },
    entryReferences: {
      title: 'References',
      icon: 'ListBulleted',
      isVisible: tabVisible.entryReferences,
      isEnabled: () => entityInfo.type === 'Entry' && hasLinks(editorData.entity.data.fields),
      render() {
        return (
          <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
            {selectedTab === 'entryReferences' && <ReferencesTab entity={editorData.entity.data} />}
          </div>
        );
      },
      onClick(selectedTab) {
        setSelectedTab(selectedTab);
        trackTabOpen(selectedTab);
      },
    },
  };

  const tagsTab = useMemo(() => {
    return {
      title: 'Tags',
      icon: 'CodeTrimmed',
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
      tabs['entryContentTags'] = tagsTab;
    } else if (Config.env !== 'production') {
      console.log(`enable "${SHAREJS_REMOVAL}" feature flag to show content tags`);
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
          icon={<NavigationIcon icon="content" size="xlarge" color="green" />}
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
          type={editorData.editorExtension ? 'full' : 'default'}
          className={styles.mainContent}>
          <Tabs className={styles.tabs} withDivider>
            {Object.keys(tabs)
              .filter((key) => tabs[key].isVisible)
              .map((key) => (
                <Tab
                  id={key}
                  key={key}
                  testId={`test-id-${key}`}
                  disabled={!tabs[key].isEnabled()}
                  selected={selectedTab === key}
                  className={styles.tab}
                  onSelect={tabs[key].onClick}>
                  <Icon icon={tabs[key].icon} color="muted" className={styles.tabIcon} />
                  {tabs[key].title}
                </Tab>
              ))}
          </Tabs>
          <StatusNotification {...statusNotificationProps} />
          {Object.keys(tabs)
            .filter((key) => tabs[key].isVisible)
            .map((key) => (
              <TabPanel
                id={key}
                key={key}
                className={cx(styles.tabPanel, { [styles.isVisible]: selectedTab === key })}>
                {tabs[key].render()}
              </TabPanel>
            ))}
        </Workbench.Content>
        <Workbench.Sidebar className={styles.sidebar}>
          <EntrySidebar
            entrySidebarProps={entrySidebarProps}
            sidebarToggleProps={sidebarToggleProps}
          />
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

export default EntryEditorWorkbench;
