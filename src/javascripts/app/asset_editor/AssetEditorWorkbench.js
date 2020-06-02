import React from 'react';
import PropTypes from 'prop-types';
// import { css, cx } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
// import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import WorkbenchTitle from 'components/shared/WorkbenchTitle';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';

const AssetEditorWorkbench = ({ title, localeData, entityInfo }) => {
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
              {/* <EntrySecondaryActions
                entityInfo={entityInfo}
                entryActions={entryActions}
                onDelete={state.delete}
              /> */}
            </>
          }></Workbench.Header>
      </Workbench>
      {/* <header class="workbench-header">
        <react-component name="app/entity_editor/Components/BackNav"></react-component>
        <cf-icon class="workbench-header__icon" name="page-media" scale="1"></cf-icon>
        <react-component
          name="components/shared/WorkbenchTitle"
          props="{title, localeName: localeData.focusedLocale.name, isSingleLocaleModeOn: localeData.isSingleLocaleModeOn, contentTypeName: 'Asset', entityInfo }"></react-component>
        <div class="workbench-header__actions">
          <div id="editor-status-switch-{{entityInfo.id}}"></div>
          <button
            class="btn-secondary-action"
            data-test-id="trigger-delete-modal"
            ui-command="state.delete">
            Delete
          </button>
        </div>
      </header>
      <div class="workbench-main">
        <div class="workbench-main__content">
          <react-component
            name="app/entity_editor/StatusNotification"
            props="statusNotificationProps"></react-component>
          <div class="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
            <cf-error-list class="form-box-error" cf-error-path="['fields']"></cf-error-list>
            <cf-entity-field ng-repeat="widget in widgets track by widget.fieldId"></cf-entity-field>
            <react-component
              name="app/asset_editor/ContentTagsField"
              props="tagProps"></react-component>
          </div>
        </div>
        <div class="workbench-main__sidebar">
          <react-component
            name="app/EntrySidebar/EntrySidebar"
            props="{entrySidebarProps, sidebarToggleProps: { commentsToggle: {isEnabled: false }}}"></react-component>
        </div>
      </div> */}
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
};

export default AssetEditorWorkbench;
