import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Workbench, Button } from '@contentful/forma-36-react-components';
// import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import StatusNotification from 'app/entity_editor/StatusNotification';
import ContentTagsField from 'app/asset_editor/ContentTagsField';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import AngularComponent from 'ui/Framework/AngularComponent';

const styles = {
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    padding: '0',
  }),
};

const AssetEditorWorkbench = ({
  title,
  localeData,
  entityInfo,
  state,
  statusNotificationProps,
  tagProps,
  entrySidebarProps,
  fields,
  widgets,
  editorContext,
  getOtDoc,
  getEditorData,
}) => {
  const otDoc = getOtDoc();
  const editorData = getEditorData();
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
          icon={<NavigationIcon icon="media" size="xlarge" color="green" />}
          actions={
            <>
              <div id={`editor-status-switch-${entityInfo.id}`} />
              <Button onClick={() => state.delete.execute()} buttonType="muted">
                Delete
              </Button>
            </>
          }
        />
        <Workbench.Content type="text">
          <StatusNotification {...statusNotificationProps} />
          <div className="entity-editor-form">
            <AngularComponent
              template={`<cf-error-list class="form-box-error" cf-error-path="['fields']"></cf-error-list>`}
              scope={{
                widgets,
                localeData,
                editorContext,
                fields,
                entityInfo,
                otDoc,
                editorData,
              }}
            />

            <AngularComponent
              template={`<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId"></cf-entity-field>`}
              scope={{
                widgets,
                localeData,
                editorContext,
                fields,
                entityInfo,
                otDoc,
                editorData: getEditorData(),
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
  tagProps: PropTypes.any,
  entrySidebarProps: PropTypes.object,
  fields: PropTypes.object,
  widgets: PropTypes.object,
  getOtDoc: PropTypes.func,
  editorContext: PropTypes.shape({
    entityInfo: PropTypes.object,
  }),
  getEditorData: PropTypes.func,
};

export default AssetEditorWorkbench;
