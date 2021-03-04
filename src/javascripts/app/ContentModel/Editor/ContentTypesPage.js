import React, { useEffect } from 'react';
import { get, isEqual } from 'lodash';
import { Workbench } from '@contentful/forma-36-react-components';
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

function isEntryEditorWidget(widget) {
  return widget.locations?.includes(WidgetLocation.ENTRY_EDITOR);
}

export default function ContentTypesPage(props) {
  const customWidgets = props.extensions.filter(isEntryEditorWidget);
  const { actions, state, setContextDirty, setEditorInterface } = useCreateActions({
    editorInterface: props.editorInterface,
    extensions: props.extensions,
    contentTypeId: props.contentTypeData.sys.id,
    isNew: props.isNew,
    updateAngularContext: props.updateContext,
    syncContentTypeWithScope: props.syncContentType,
    contentTypeData: props.contentTypeData,
  });

  useEffect(() => {
    if (props.isNew && state.contentType.handleUpdate && actions.setContentType) {
      openCreateDialog(props.contentTypeIds, state.contentType, actions.setContentType);
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

  return (
    <Workbench>
      <Workbench.Header
        title={state.contentType.data.name}
        icon={<ProductIcon icon="ContentModel" size="large" color="positive" />}
        description={state.contentType.data.description}
        actions={
          <ContentTypePageActions
            isNew={props.isNew}
            canEdit={props.canEdit}
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
          hasAdvancedExtensibility={props.hasAdvancedExtensibility}
        />
        <form name="contentTypeForm">
          {props.currentTab === 'fields' && (
            <React.Fragment>
              <DocumentTitle title={[state.contentType.data.name, 'Content Model']} />
              <FieldsList
                displayField={state.contentType.data.displayField}
                canEdit={props.canEdit}
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
          {props.hasAdvancedExtensibility && props.currentTab === 'sidebar_configuration' && (
            <React.Fragment>
              <DocumentTitle
                title={['Sidebar Configuration', state.contentType.data.name, 'Content Model']}
              />
              <div>
                <SidebarConfiguration
                  configuration={state.editorInterface.sidebar}
                  extensions={props.extensions}
                  onUpdateConfiguration={onUpdateConfiguration}
                />
              </div>
            </React.Fragment>
          )}
          {props.hasAdvancedExtensibility && props.currentTab === 'entry_editor_configuration' && (
            <>
              <DocumentTitle
                title={['Entry editors', state.contentType.data.name, 'Content Model']}
              />
              <div>
                <EntryEditorConfiguration
                  configuration={state.editorInterface.editors}
                  customWidgets={customWidgets}
                  getDefaultEntryEditorConfiguration={getEntryConfiguration.bind(
                    null,
                    props.spaceData
                  )}
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
              canEdit={props.canEdit}
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
  );
}

ContentTypesPage.propTypes = {
  updateContext: PropTypes.func.isRequired,
  syncContentType: PropTypes.func.isRequired,
  contentTypeIds: PropTypes.array.isRequired,
  isNew: PropTypes.bool.isRequired,
  contentTypeData: PropTypes.object.isRequired,
  canEdit: PropTypes.bool.isRequired,
  currentTab: PropTypes.string.isRequired,
  actions: PropTypes.shape({
    showNewFieldDialog: PropTypes.object.isRequired,
    showMetadataDialog: PropTypes.object.isRequired,
    save: PropTypes.object.isRequired,
    delete: PropTypes.object.isRequired,
    cancel: PropTypes.object.isRequired,
    duplicate: PropTypes.object.isRequired,
    openFieldDialog: PropTypes.func.isRequired,
    setFieldAsTitle: PropTypes.func.isRequired,
    toggleFieldProperty: PropTypes.func.isRequired,
    deleteField: PropTypes.func.isRequired,
    undeleteField: PropTypes.func.isRequired,
    updateOrder: PropTypes.func.isRequired,
    updateSidebarConfiguration: PropTypes.func.isRequired,
    updateEditorConfiguration: PropTypes.func.isRequired,
    loadPreview: PropTypes.func.isRequired,
  }).isRequired,
  hasAdvancedExtensibility: PropTypes.bool.isRequired,
  editorInterface: PropTypes.any.isRequired,
  extensions: PropTypes.array,
  spaceData: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    organizationId: PropTypes.string.isRequired,
  }),
};
