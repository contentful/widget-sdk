import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Workbench, Button } from '@contentful/forma-36-react-components';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import StatusNotification from 'app/entity_editor/StatusNotification';
import ContentTagsField from 'app/asset_editor/ContentTagsField';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import AngularComponent from 'ui/Framework/AngularComponent';
import tokens from '@contentful/forma-36-tokens';
import { makeFieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';
import { filterWidgets } from 'app/entry_editor/formWidgetsController';

const styles = {
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    padding: '0',
  }),
  statusSwitchWrapper: css({
    marginRight: tokens.spacingM,
  }),
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

  const { widgets } = filterWidgets(localeData, editorContext, editorData.fieldControls.form);

  const fieldLocaleListeners = useMemo(
    () => makeFieldLocaleListeners(editorData.fieldControls.all, editorContext, localeData, otDoc),
    [editorData.fieldControls.all, editorContext, localeData, otDoc]
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
          icon={<NavigationIcon icon="Media" size="xlarge" />}
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
        <Workbench.Content type="text">
          <StatusNotification {...statusNotificationProps} />
          <div className="entity-editor-form">
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

            <ContentTagsField {...tagProps} />
          </div>
        </Workbench.Content>
        <Workbench.Sidebar position="right" className={styles.sidebar}>
          <EntrySidebar
            entrySidebarProps={entrySidebarProps}
            sidebarToggleProps={{ commentsToggle: { isEnabled: false } }}
          />
        </Workbench.Sidebar>
      </Workbench>
    </div>
  );
};

AssetEditorWorkbench.propTypes = {
  title: PropTypes.string.isRequired,
  localeData: PropTypes.shape({
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
