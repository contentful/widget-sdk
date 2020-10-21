import React, { useState, useCallback } from 'react';
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
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';

function isEntryEditorWidget(widget) {
  return widget.locations?.includes(WidgetLocation.ENTRY_EDITOR);
}

export default function ContentTypesPage(props) {
  const showSidebar = props.currentTab === 'fields' || props.currentTab === 'preview';

  const [sidebarConfiguration, updateSidebarConfiguration] = useState(props.sidebarConfiguration);
  const [entryEditorConfiguration, updateEntryEditorConfiguration] = useState(
    props.editorConfiguration
  );

  const onUpdateConfiguration = useCallback(
    (configuration) => {
      updateSidebarConfiguration(configuration);
      props.actions.updateSidebarConfiguration(configuration);
    },
    [updateSidebarConfiguration, props.actions]
  );

  const onEntryEditorUpdateConfiguration = useCallback(
    (configuration) => {
      updateEntryEditorConfiguration(configuration);
      props.actions.updateEditorConfiguration(configuration);
    },
    [updateEntryEditorConfiguration, props.actions]
  );

  return (
    <Workbench>
      <Workbench.Header
        title={props.contentTypeName}
        icon={<NavigationIcon icon="ContentModel" size="large" color="positive" />}
        description={props.contentTypeData.description}
        actions={
          <ContentTypePageActions
            isNew={props.isNew}
            canEdit={props.canEdit}
            save={props.actions.save}
            delete={props.actions.delete}
            cancel={props.actions.cancel}
            duplicate={props.actions.duplicate}
            showMetadataDialog={props.actions.showMetadataDialog}
          />
        }
      />
      <Workbench.Content type="text">
        <EditorFieldTabs
          fieldsCount={props.contentTypeData.fields.length}
          currentTab={props.currentTab}
          hasAdvancedExtensibility={props.hasAdvancedExtensibility}
        />
        <form name="contentTypeForm">
          {props.currentTab === 'fields' && (
            <React.Fragment>
              <DocumentTitle title={[props.contentTypeData.name, 'Content Model']} />
              <FieldsList
                displayField={props.contentTypeData.displayField}
                canEdit={props.canEdit}
                fields={props.contentTypeData.fields}
                actions={props.actions}
              />
            </React.Fragment>
          )}
          {props.currentTab === 'preview' && (
            <React.Fragment>
              <DocumentTitle title={['Preview', props.contentTypeData.name, 'Content Model']} />
              <ContentTypePreview
                isDirty={props.isDirty}
                publishedVersion={get(props.contentTypeData, 'sys.publishedVersion')}
                loadPreview={props.actions.loadPreview}
              />
            </React.Fragment>
          )}
          {props.hasAdvancedExtensibility && props.currentTab === 'sidebar_configuration' && (
            <>
              <DocumentTitle
                title={['Sidebar Configuration', props.contentTypeData.name, 'Content Model']}
              />
              <div>
                <SidebarConfiguration
                  configuration={sidebarConfiguration}
                  extensions={props.extensions}
                  onUpdateConfiguration={onUpdateConfiguration}
                />
              </div>
            </>
          )}
          {props.hasAdvancedExtensibility && props.currentTab === 'entry_editor_configuration' && (
            <>
              <DocumentTitle
                title={['Entry editors', props.contentTypeData.name, 'Content Model']}
              />
              <div>
                <EntryEditorConfiguration
                  configuration={entryEditorConfiguration}
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
              showNewFieldDialog={props.actions.showNewFieldDialog}
              fieldsUsed={props.contentTypeData.fields.length}
            />
            <EntryEditorSection />
            <ContentTypeIdSection contentTypeId={props.contentTypeData.sys.id} />
            <DocumentationSection />
          </div>
        </Workbench.Sidebar>
      )}
    </Workbench>
  );
}

ContentTypesPage.propTypes = {
  isDirty: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  contentTypeName: PropTypes.string.isRequired,
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
  sidebarConfiguration: PropTypes.array,
  editorConfiguration: PropTypes.array,
  // TODO: rename to "widgets". Make sure it "isRequired".
  extensions: PropTypes.array,
  spaceData: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    organizationId: PropTypes.string.isRequired,
  }),
};
