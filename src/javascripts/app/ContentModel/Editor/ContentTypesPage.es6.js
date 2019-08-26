import React, { useState, useCallback } from 'react';
import { get } from 'lodash';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import ContentTypePageActions from './ContentTypePageActions.es6';
import {
  FieldsSection,
  ContentTypeIdSection,
  DocumentationSection
} from './Sidebar/ContentModelSidebar.es6';
import EntryEditorAppearanceSection from './Sidebar/EntryEditorAppearanceSection.es6';
import PropTypes from 'prop-types';
import EditorFieldTabs from './EditorFieldTabs.es6';
import FieldsList from './FieldsTab/FieldsList.es6';
import ContentTypePreview from './PreviewTab/ContentTypePreview.es6';
import SidebarConfiguration from 'app/EntrySidebar/Configuration/SidebarConfiguration.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import ContentFieldsIcon from './ContentFieldsIcon.es6';

export default function ContentTypesPage(props) {
  const showSidebar = props.currentTab === 'fields' || props.currentTab === 'preview';

  const [sidebarConfiguration, updateSidebarConfiguration] = useState(props.sidebarConfiguration);

  const onUpdateConfiguration = useCallback(
    configuration => {
      updateSidebarConfiguration(configuration);
      props.actions.updateSidebarConfiguration(configuration);
    },
    [updateSidebarConfiguration, props.actions]
  );

  return (
    <Workbench>
      <Workbench.Header
        title={props.contentTypeName}
        icon={<ContentFieldsIcon />}
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
            {props.hasAdvancedExtensibility && (
              <EntryEditorAppearanceSection
                extensions={props.extensions}
                editorConfiguration={props.editorConfiguration}
                updateEditorConfiguration={props.actions.updateEditorConfiguration}
              />
            )}
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
    loadPreview: PropTypes.func.isRequired
  }).isRequired,
  hasAdvancedExtensibility: PropTypes.bool.isRequired,
  sidebarConfiguration: PropTypes.array,
  editorConfiguration: PropTypes.object,
  extensions: PropTypes.array
};
