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
import ContentTagsField from 'app/asset_editor/ContentTagsField';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import AngularComponent from 'ui/Framework/AngularComponent';
import tokens from '@contentful/forma-36-tokens';
import { useFieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';
import { filterWidgets } from 'app/entry_editor/formWidgetsController';
import { useTagsFeatureEnabled } from 'features/content-tags';
import { styles as editorStyles } from './../entry_editor/styles';
import { PolicyBuilderConfig } from 'access_control/PolicyBuilder/PolicyBuilderConfig';

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
  entityInfo,
  state,
  statusNotificationProps,
  entrySidebarProps,
  fields,
  editorContext,
  getOtDoc,
  tagProps,
  getEditorData,
}) => {
  const otDoc = getOtDoc();
  const editorData = getEditorData();

  const widgets = filterWidgets(localeData, editorContext, editorData.fieldControls.form);

  const fieldLocaleListeners = useFieldLocaleListeners(
    editorData.fieldControls.all,
    editorContext,
    localeData.privateLocales,
    localeData.defaultLocale,
    otDoc
  );

  const { tagsEnabled } = useTagsFeatureEnabled();
  const [selectedTab, setSelectedTab] = useState(AssetTabs.Editor);
  const canEditTags = otDoc.permissions.canEditFieldLocale(
    PolicyBuilderConfig.TAGS,
    PolicyBuilderConfig.PATH_WILDCARD
  );

  return (
    <div className="asset-editor">
      <Workbench>
        <Workbench.Header
          onBack={() => goToPreviousSlideOrExit('arrow_back')}
          title={
            <WorkbenchTitle
              title={title}
              localeName={localeData.focusedLocale.name}
              isSingleLocaleModeOn={localeData.isSingleLocaleModeOn}
              contentTypeName="Asset"
              entityInfo={entityInfo}
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
              onSelect={setSelectedTab}>
              <Icon icon={'Entry'} color="muted" className={editorStyles.tabIcon} />
              {AssetTabs.Editor}
            </Tab>
            {tagsEnabled && (
              <Tab
                className={editorStyles.tab}
                selected={selectedTab === AssetTabs.Tags}
                id={AssetTabs.Tags}
                onSelect={setSelectedTab}>
                <Icon icon={'Tags'} color="muted" className={editorStyles.tabIcon} />
                {AssetTabs.Tags}
                <Tag className={editorStyles.promotionTag}>new</Tag>
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
              <AngularComponent
                template={
                  '<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId"></cf-entity-field>'
                }
                scope={{
                  fieldLocaleListeners,
                  widgets,
                  localeData,
                  editorContext,
                  fields,
                  entityInfo,
                  otDoc,
                  editorData,
                }}
              />
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
              {tagsEnabled && <ContentTagsField {...tagProps} disable={!canEditTags} />}
            </div>
          </TabPanel>
        </Workbench.Content>
        <Workbench.Sidebar position="right" className={styles.sidebar}>
          <EntrySidebar entrySidebarProps={entrySidebarProps} disableComments />
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
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
  }),
  state: PropTypes.shape({
    delete: PropTypes.object,
  }),
  statusNotificationProps: PropTypes.object,
  entrySidebarProps: PropTypes.object,
  fields: PropTypes.object,
  getOtDoc: PropTypes.func,
  editorContext: PropTypes.shape({
    entityInfo: PropTypes.object,
  }),
  getEditorData: PropTypes.func,
  tagProps: PropTypes.any,
};

export default AssetEditorWorkbench;
