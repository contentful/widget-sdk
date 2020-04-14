import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';
import EntrtySecondaryActions from 'app/entry_editor/EntryTitlebar/EntrySecondaryActions/EntrySecondaryActions';
import StatusNotification from 'app/entity_editor/StatusNotification';
import CustomEditorExtensionRenderer from 'app/entry_editor/CustomEditorExtensionRenderer';
import NoLocalizedFieldsAdvice from 'components/tabs/NoLocalizedFieldsAdvice';
import EntrySidebar from 'app/EntrySidebar/EntrySidebar';
import AngularComponent from 'ui/Framework/AngularComponent';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';

const styles = {
  mainContent: css({
    paddingTop: 0,
  }),
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    width: '360px',
    padding: '0',
  }),
};

const EntryEditorWorkbench = ({
  localeData,
  title,
  editorData,
  entityInfo,
  entryActions,
  state,
  statusNotificationProps,
  editorExtension,
  customExtensionProps,
  widgets,
  editorContext,
  otDoc,
  shouldDisplayNoLocalizedFieldsAdvice,
  noLocalizedFieldsAdviceProps,
  entrySidebarProps,
  sidebarToggleProps,
}) => (
  <div className="entry-editor">
    <Workbench>
      <Workbench.Header
        onBack={() => goToPreviousSlideOrExit('arrow_back')}
        title={
          <WorkbenchTitle
            title={title}
            localeName={localeData.focusedLocale.name}
            isSingleLocaleModeOn={localeData.isSingleLocaleModeOn}
            contentTypeName={editorData.contentType.data.name}
            entityInfo={editorData.entityInfo}
          />
        }
        icon={<NavigationIcon icon="content" size="large" color="green" />}
        actions={
          <>
            <div id={`editor-status-switch-${entityInfo.id}`} />
            <EntrtySecondaryActions
              entityInfo={entityInfo}
              entryActions={entryActions}
              onDelete={state.delete}
            />
          </>
        }
      />
      <Workbench.Content className={styles.mainContent}>
        <StatusNotification {...statusNotificationProps}></StatusNotification>
        {editorExtension && <CustomEditorExtensionRenderer {...customExtensionProps} />}
        {!editorExtension && (
          <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
            <AngularComponent
              template={`<cf-error-list
                      className="form-box-error"
                      cf-error-path="['fields']"></cf-error-list>`}
              scope={{
                widgets: widgets,
                editorContext: editorContext,
                localeData: localeData,
                otDoc: otDoc,
                entityInfo: editorContext.entityInfo,
              }}
            />

            <AngularComponent
              template={'<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId" />'}
              scope={{
                widgets: widgets,
                editorContext: editorContext,
                localeData: localeData,
                otDoc: otDoc,
                entityInfo: editorContext.entityInfo,
              }}
            />
            {shouldDisplayNoLocalizedFieldsAdvice && (
              <NoLocalizedFieldsAdvice {...noLocalizedFieldsAdviceProps} />
            )}
          </div>
        )}
      </Workbench.Content>
      <Workbench.Sidebar className={styles.sidebar}>
        <EntrySidebar
          entrySidebarProps={entrySidebarProps}
          sidebarToggleProps={sidebarToggleProps}></EntrySidebar>
      </Workbench.Sidebar>
    </Workbench>
  </div>
);

EntryEditorWorkbench.propTypes = {
  title: PropTypes.string.isRequired,
  localeData: PropTypes.shape({
    focusedLocale: PropTypes.shape({
      name: PropTypes.string,
    }),
    isSingleLocaleModeOn: PropTypes.bool,
  }),
  customExtensionProps: PropTypes.object,
  editorExtension: PropTypes.bool,
  statusNotificationProps: PropTypes.object,
  widgets: PropTypes.object,
  otDoc: PropTypes.object,
  shouldDisplayNoLocalizedFieldsAdvice: PropTypes.bool,
  noLocalizedFieldsAdviceProps: PropTypes.object,
  sidebarToggleProps: PropTypes.object,
  entrySidebarProps: PropTypes.object,
  editorContext: PropTypes.shape({
    entityInfo: PropTypes.object,
  }),
  state: PropTypes.shape({
    delete: PropTypes.func,
  }),
  entryActions: PropTypes.object,
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
  }),
  editorData: PropTypes.shape({
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
    }),
    contentType: PropTypes.shape({
      data: PropTypes.shape({
        name: PropTypes.string,
      }),
    }),
  }),
};

export default EntryEditorWorkbench;
