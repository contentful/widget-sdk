import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
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
    padding: 0,
    '& > div': {
      minHeight: '100%',
      height: '100%',
    },
  }),
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    width: '360px',
    padding: '0',
  }),
  statusNotification: css({
    margin: `0 -${tokens.spacingL}`,
  }),
};

const EntryEditorWorkbench = ({
  localeData,
  title,
  fields,
  entityInfo,
  entryActions,
  state,
  statusNotificationProps,
  getEditorData,
  customExtensionProps,
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
              <EntrtySecondaryActions
                entityInfo={entityInfo}
                entryActions={entryActions}
                onDelete={state.delete}
              />
            </>
          }
        />
        <Workbench.Content className={styles.mainContent}>
          <StatusNotification {...statusNotificationProps} className={styles.statusNotification} />
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
                  editorData: getEditorData(),
                  otDoc,
                  entityInfo,
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
};

EntryEditorWorkbench.propTypes = {
  title: PropTypes.string.isRequired,
  localeData: PropTypes.shape({
    focusedLocale: PropTypes.shape({
      name: PropTypes.string,
    }),
    isSingleLocaleModeOn: PropTypes.bool,
  }),
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
  state: PropTypes.shape({
    delete: PropTypes.object,
  }),
  entryActions: PropTypes.object,
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
  }),
};

export default EntryEditorWorkbench;
