import React, { useEffect } from 'react';
import { css } from 'emotion';
import { get, isEqual } from 'lodash';
import { Workbench, Flex } from '@contentful/forma-36-react-components';
import ContentTypePageActions from './ContentTypePageActions';
import {
  FieldsSection,
  ContentTypeIdSection,
  DocumentationSection,
  EntryEditorSection,
} from './Sidebar/ContentModelSidebar';
import PropTypes from 'prop-types';
import EditorFieldTabs from './EditorFieldTabs';
import FieldsList from './FieldsTab/FieldsList';
import ContentTypePreview from './PreviewTab/ContentTypePreview';
import SidebarConfiguration from 'app/EntrySidebar/Configuration/SidebarConfiguration';
import EntryEditorConfiguration from './EntryEditorConfigurationTab/EntryEditorConfig';
import { getEntryConfiguration } from 'app/entry_editor/DefaultConfiguration';
import DocumentTitle from 'components/shared/DocumentTitle';
import { WidgetLocation } from '@contentful/widget-renderer';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import useCreateActions from 'app/ContentModel/Editor/Actions';
import { openCreateDialog } from './Utils';
import * as accessChecker from 'access_control/AccessChecker';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { LoadingState } from 'features/loading-state';

const styles = {
  loaderWrapper: css({
    height: '100%',
  }),
};

function isEntryEditorWidget(widget) {
  return widget.locations?.includes(WidgetLocation.ENTRY_EDITOR);
}

export default function ContentTypesPage(props) {
  const {
    currentOrganizationId: organizationId,
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
  } = useSpaceEnvContext();

  const spaceData = { organizationId, spaceId, environmentId };
  const canEdit = accessChecker.can('update', 'ContentType');
  const {
    actions,
    state,
    setContextDirty,
    setEditorInterface,
    contentTypeIds,
    hasAdvancedExtensibility,
    extensions,
  } = useCreateActions({
    contentTypeId: props.contentTypeId,
    isNew: props.isNew,
  });

  const customWidgets = extensions.filter(isEntryEditorWidget);

  useEffect(() => {
    if (props.isNew && state.contentType.handleUpdate && actions.setContentType) {
      openCreateDialog(contentTypeIds, state.contentType, actions.setContentType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contentType.handleUpdate]);

  const showSidebar = props.currentTab === 'fields' || props.currentTab === 'preview';
  const onUpdateConfiguration = (sidebar) => {
    if (!isEqual(sidebar, state.editorInterface.sidebar)) {
      setEditorInterface({ ...state.editorInterface, sidebar });
      setContextDirty(true);
    }
  };

  const onEntryEditorUpdateConfiguration = (editors) => {
    setEditorInterface({ ...state.editorInterface, editors });
    setContextDirty(true);
  };

  if (!state.contentType) return null;

  return state.contentType.data.fields ? (
    <Workbench>
      <Workbench.Header
        title={state.contentType.data.name}
        icon={<ProductIcon icon="ContentModel" size="large" color="positive" />}
        description={state.contentType.data.description}
        actions={
          <ContentTypePageActions
            isNew={props.isNew}
            canEdit={canEdit}
            save={actions.save}
            delete={actions.delete}
            cancel={actions.cancel}
            duplicate={actions.duplicate}
            showMetadataDialog={actions.showMetadataDialog}
          />
        }
      />
      <Workbench.Content type="text">
        <EditorFieldTabs
          fieldsCount={state.contentType.data.fields.length}
          currentTab={props.currentTab}
          setCurrentTab={props.setCurrentTab}
          hasAdvancedExtensibility={hasAdvancedExtensibility}
        />
        <form name="contentTypeForm">
          {props.currentTab === 'fields' && (
            <React.Fragment>
              <DocumentTitle title={[state.contentType.data.name, 'Content Model']} />
              <FieldsList
                displayField={state.contentType.data.displayField}
                canEdit={canEdit}
                fields={state.contentType.data.fields}
                actions={actions}
              />
            </React.Fragment>
          )}
          {props.currentTab === 'preview' && (
            <React.Fragment>
              <DocumentTitle title={['Preview', state.contentType.data.name, 'Content Model']} />
              <ContentTypePreview
                isDirty={state.contextState.dirty}
                publishedVersion={get(state.contentType.data, 'sys.publishedVersion')}
                loadPreview={actions.loadPreview}
              />
            </React.Fragment>
          )}
          {hasAdvancedExtensibility && props.currentTab === 'sidebar_configuration' && (
            <React.Fragment>
              <DocumentTitle
                title={['Sidebar Configuration', state.contentType.data.name, 'Content Model']}
              />
              <div>
                <SidebarConfiguration
                  configuration={state.editorInterface.sidebar}
                  extensions={extensions}
                  onUpdateConfiguration={onUpdateConfiguration}
                />
              </div>
            </React.Fragment>
          )}
          {hasAdvancedExtensibility && props.currentTab === 'entry_editor_configuration' && (
            <>
              <DocumentTitle
                title={['Entry editors', state.contentType.data.name, 'Content Model']}
              />
              <div>
                <EntryEditorConfiguration
                  configuration={state.editorInterface.editors}
                  customWidgets={customWidgets}
                  getDefaultEntryEditorConfiguration={getEntryConfiguration.bind(null, spaceData)}
                  onUpdateConfiguration={onEntryEditorUpdateConfiguration}
                />
              </div>
            </>
          )}
        </form>
      </Workbench.Content>
      {showSidebar && (
        <Workbench.Sidebar position="right">
          <div>
            <FieldsSection
              canEdit={canEdit}
              showNewFieldDialog={actions.showNewFieldDialog}
              fieldsUsed={state.contentType.data.fields.length}
            />
            <EntryEditorSection />
            <ContentTypeIdSection contentTypeId={state.contentType.data.sys.id} />
            <DocumentationSection />
          </div>
        </Workbench.Sidebar>
      )}
    </Workbench>
  ) : (
    <Flex className={styles.loaderWrapper}>
      <LoadingState />
    </Flex>
  );
}

ContentTypesPage.propTypes = {
  isNew: PropTypes.bool,
  contentTypeId: PropTypes.string,
  currentTab: PropTypes.string.isRequired,
  setCurrentTab: PropTypes.func.isRequired,
};
