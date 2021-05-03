import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import {
  Workbench,
  Button,
  Tab,
  TabPanel,
  Tabs,
  Icon,
  Tag,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import StatusNotification from 'app/entity_editor/StatusNotification';
import { ContentTagsTab } from 'app/entity_editor/ContentTagsTab';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import tokens from '@contentful/forma-36-tokens';
import { useFieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';
import { filterWidgets } from 'app/entry_editor/formWidgetsController';
import { useTagsFeatureEnabled } from 'features/content-tags';
import { styles as editorStyles } from '../entry_editor/styles';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isUnscopedRoute } from 'core/services/SpaceEnvContext/utils';
import { getModule } from 'core/NgRegistry';
import { EntityField } from 'app/entity_editor/EntityField/EntityField';

const styles = {
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    padding: '0',
  }),
  statusSwitchWrapper: css({
    marginRight: tokens.spacingM,
  }),
};

const AssetTabs = {
  Editor: 'Editor',
  Tags: 'Tags',
};

const AssetEditorWorkbench = ({
  title,
  localeData,
  preferences,
  state,
  statusNotificationProps,
  entrySidebarProps,
  fields,
  editorContext,
  otDoc,
  editorData,
  incomingLinks,
  state: { current },
}) => {
  const widgets = filterWidgets(localeData, editorContext, editorData.fieldControls.form);
  const { entityInfo } = editorData;

  const fieldLocaleListeners = useFieldLocaleListeners(
    editorData.fieldControls.all,
    editorContext,
    localeData.privateLocales,
    localeData.defaultLocale,
    otDoc
  );

  const { tagsEnabled } = useTagsFeatureEnabled();
  const [selectedTab, setSelectedTab] = useState(() =>
    Object.values(AssetTabs).includes(preferences.tab) ? preferences.tab : AssetTabs.Editor
  );

  // angular url updates to persist tab selection on reload
  // kill this with fire when react migration allows it
  const { currentSpace } = useSpaceEnvContext();
  const routeIsUnscoped = isUnscopedRoute(currentSpace);
  const $state = getModule('$state');
  const setTabInUrl = (tab) =>
    $state.transitionTo(
      routeIsUnscoped ? 'spaces.detail.assets.detail' : 'spaces.detail.environment.assets.detail',
      { tab: tab === 'Editor' ? null : tab },
      {
        location: true, // This makes it update URL
        inherit: true,
        relative: $state.$current,
        notify: false, // This makes it not reload
      }
    );

  const navigateToTab = (tab) => {
    setTabInUrl(tab);
    setSelectedTab(tab);
  };

  const onBack = async () => {
    await setTabInUrl(null);
    goToPreviousSlideOrExit('arrow_back');
  };

  return (
    <div className="asset-editor">
      <Workbench>
        <Workbench.Header
          onBack={onBack}
          title={
            <WorkbenchTitle
              title={title}
              localeName={localeData.focusedLocale.name}
              isSingleLocaleModeOn={localeData.isSingleLocaleModeOn}
              contentTypeName="Asset"
              incomingLinks={incomingLinks}
            />
          }
          icon={<ProductIcon icon="Media" size="xlarge" />}
          actions={
            <>
              <div
                className={styles.statusSwitchWrapper}
                id={`editor-status-switch-${entityInfo.id}`}
              />
              <Button
                testId="trigger-delete-modal"
                onClick={() => state.delete.execute()}
                buttonType="muted">
                Delete
              </Button>
            </>
          }
        />

        <Workbench.Content type="full" className={editorStyles.mainContent}>
          <Tabs withDivider className={editorStyles.tabs}>
            <Tab
              className={styles.tab}
              selected={selectedTab === AssetTabs.Editor}
              id={AssetTabs.Editor}
              onSelect={navigateToTab}>
              <Icon icon={'Entry'} color="muted" className={editorStyles.tabIcon} />
              {AssetTabs.Editor}
            </Tab>
            {tagsEnabled && (
              <Tab
                className={editorStyles.tab}
                selected={selectedTab === AssetTabs.Tags}
                id={AssetTabs.Tags}
                onSelect={navigateToTab}>
                <Icon icon={'Tags'} color="muted" className={editorStyles.tabIcon} />
                {AssetTabs.Tags}
                <Tag tagType="primary-filled" size="small" className={editorStyles.promotionTag}>
                  new
                </Tag>
              </Tab>
            )}
          </Tabs>

          <TabPanel
            id={`panel-editor`}
            className={cx(editorStyles.tabPanel, {
              [editorStyles.isVisible]: selectedTab === AssetTabs.Editor,
            })}>
            <div
              className={
                'entity-editor-form cf-workbench-content workbench-layer--is-current cf-workbench-content-type__text'
              }>
              <StatusNotification {...statusNotificationProps} />
              {widgets.map((widget, index) => (
                <EntityField
                  editorContext={editorContext}
                  editorData={editorData}
                  fieldLocaleListeners={fieldLocaleListeners}
                  fields={fields}
                  index={index}
                  key={widget.fieldId}
                  localeData={localeData}
                  doc={otDoc}
                  preferences={preferences}
                  widget={widget}
                />
              ))}
            </div>
          </TabPanel>
          <TabPanel
            id={`panel-tags`}
            className={cx(editorStyles.tabPanel, {
              [editorStyles.isVisible]: selectedTab === AssetTabs.Tags,
            })}>
            <div
              className={
                'entity-editor-form cf-workbench-content workbench-layer--is-current cf-workbench-content-type__text'
              }>
              {tagsEnabled && (
                <ContentTagsTab doc={otDoc} entityType="asset" entityState={current} />
              )}
            </div>
          </TabPanel>
        </Workbench.Content>
        <Workbench.Sidebar position="right" className={styles.sidebar}>
          {entrySidebarProps && (
            <EntrySidebar entrySidebarProps={entrySidebarProps} disableComments />
          )}
        </Workbench.Sidebar>
      </Workbench>
    </div>
  );
};

AssetEditorWorkbench.propTypes = {
  title: PropTypes.string.isRequired,
  localeData: PropTypes.shape({
    privateLocales: PropTypes.arrayOf(PropTypes.object),
    defaultLocale: PropTypes.object,
    focusedLocale: PropTypes.shape({
      name: PropTypes.string,
    }),
    isSingleLocaleModeOn: PropTypes.bool,
  }),
  state: PropTypes.shape({
    delete: PropTypes.object,
    current: PropTypes.string,
  }),
  preferences: PropTypes.object,
  statusNotificationProps: PropTypes.object,
  entrySidebarProps: PropTypes.object,
  fields: PropTypes.object,
  otDoc: PropTypes.object,
  editorContext: PropTypes.shape({
    entityInfo: PropTypes.object,
  }),
  editorData: PropTypes.shape({
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
    }),
    fieldControls: PropTypes.shape({
      all: PropTypes.array,
      form: PropTypes.array,
    }),
  }),
  incomingLinks: PropTypes.arrayOf(PropTypes.any),
};

export default AssetEditorWorkbench;
