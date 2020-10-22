import React, { useEffect } from 'react';
import { get } from 'lodash';
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

function isEntryEditorWidget(widget) {
  return widget.locations?.includes(WidgetLocation.ENTRY_EDITOR);
}

export default function ContentTypesPage(props) {
  const showSidebar = props.currentTab === 'fields' || props.currentTab === 'preview';

  const {
    actions,
    contentTypeModel,
    editorInterface,
    setEditorInterface,
    contextState,
    setContextDirty,
  } = useCreateActions({
    isNew: props.isNew,
    contentType: props.contentType,
    contentTypeIds: props.contentTypeIds,
    editorInterface: props.editorInterface,
    publishedContentType: props.publishedContentType,
    extensions: props.extensions,
    saveContentType: props.saveContentType,
    updateContextDirty: props.updateContextDirty,
  });

  useEffect(() => {
    // We need to pass the fresh content type editor state to the saveAndClose action
    props.initRequestLeaveConfirmation(actions.saveAndClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTypeModel]);

  const onUpdateConfiguration = (sidebar) => {
    setEditorInterface((editorInterface) => ({ ...editorInterface, sidebar }));
    setContextDirty(true);
  };

  const onEntryEditorUpdateConfiguration = (editors) => {
    setEditorInterface((editorInterface) => ({ ...editorInterface, editors }));
    setContextDirty(true);
  };

  return (
    <Workbench>
      <Workbench.Header
        title={contentTypeModel.name}
        icon={<ProductIcon icon="ContentModel" size="large" color="positive" />}
        description={contentTypeModel.description}
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
          fieldsCount={contentTypeModel.fields.length}
          currentTab={props.currentTab}
          hasAdvancedExtensibility={props.hasAdvancedExtensibility}
        />
        <form name="contentTypeForm">
          {props.currentTab === 'fields' && (
            <React.Fragment>
              <DocumentTitle title={[contentTypeModel.name, 'Content Model']} />
              <FieldsList
                displayField={contentTypeModel.displayField}
                canEdit={props.canEdit}
                fields={contentTypeModel.fields}
                actions={actions}
              />
            </React.Fragment>
          )}
          {props.currentTab === 'preview' && (
            <React.Fragment>
              <DocumentTitle title={['Preview', contentTypeModel.name, 'Content Model']} />
              <ContentTypePreview
                isDirty={contextState.dirty}
                publishedVersion={get(contentTypeModel, 'sys.publishedVersion')}
                loadPreview={actions.loadPreview}
              />
            </React.Fragment>
          )}
          {props.hasAdvancedExtensibility && props.currentTab === 'sidebar_configuration' && (
            <React.Fragment>
              <DocumentTitle
                title={['Sidebar Configuration', contentTypeModel.name, 'Content Model']}
              />
              <div>
                <SidebarConfiguration
                  configuration={editorInterface.sidebar}
                  extensions={props.extensions}
                  onUpdateConfiguration={onUpdateConfiguration}
                />
              </div>
            </React.Fragment>
          )}
          {props.hasAdvancedExtensibility && props.currentTab === 'entry_editor_configuration' && (
            <>
              <DocumentTitle title={['Entry editors', contentTypeModel.name, 'Content Model']} />
              <div>
                <EntryEditorConfiguration
                  configuration={editorInterface.editors}
                  customWidgets={props.extensions.filter(isEntryEditorWidget)}
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
              fieldsUsed={contentTypeModel.fields.length}
            />
            <EntryEditorSection />
            <ContentTypeIdSection contentTypeId={contentTypeModel.sys.id} />
            <DocumentationSection />
          </div>
        </Workbench.Sidebar>
      )}
    </Workbench>
  );
}

ContentTypesPage.propTypes = {
  isNew: PropTypes.bool.isRequired,
  contentTypeIds: PropTypes.any.isRequired,
  contentType: PropTypes.object.isRequired,
  canEdit: PropTypes.bool.isRequired,
  currentTab: PropTypes.string.isRequired,
  hasAdvancedExtensibility: PropTypes.bool.isRequired,
  editorInterface: PropTypes.any,
  publishedContentType: PropTypes.any,
  // TODO: rename to "widgets". Make sure it "isRequired".
  extensions: PropTypes.array,
  spaceData: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    organizationId: PropTypes.string.isRequired,
  }),
  saveContentType: PropTypes.func.isRequired,
  updateContextDirty: PropTypes.func.isRequired,
  initRequestLeaveConfirmation: PropTypes.func.isRequired,
};
