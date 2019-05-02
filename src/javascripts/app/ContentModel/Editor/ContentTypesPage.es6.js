import React, { useMemo } from 'react';
import { get } from 'lodash';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import EditorFieldsHeader from './EditorFieldsHeader.es6';
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

const styles = {
  form: css({
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`
  }),
  content: css({
    paddingTop: 0
  })
};

export default function ContentTypesPage(props) {
  const showSidebar = props.currentTab === 'fields' || props.currentTab === 'preview';
  const sidebarExtensions = useMemo(
    () => props.extensions.filter(extension => extension.sidebar === true),
    [props.extensions]
  );

  return (
    <div className="workbench">
      <EditorFieldsHeader
        isNew={props.isNew}
        canEdit={props.canEdit}
        contentTypeDescription={props.contentTypeData.description}
        contentTypeName={props.contentTypeName}
        save={props.actions.save}
        delete={props.actions.delete}
        cancel={props.actions.cancel}
        duplicate={props.actions.duplicate}
        showMetadataDialog={props.actions.showMetadataDialog}
      />
      <div className="workbench-main">
        <div className={cx('workbench-main__content', styles.content)}>
          <EditorFieldTabs
            fieldsCount={props.contentTypeData.fields.length}
            currentTab={props.currentTab}
            hasAdvancedExtensibility={props.hasAdvancedExtensibility}
          />
          <form name="contentTypeForm" className={styles.form}>
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
            {props.hasAdvancedExtensibility && (
              <React.Fragment>
                {props.currentTab === 'sidebar_configuration' && (
                  <DocumentTitle
                    title={['Sidebar Configuration', props.contentTypeData.name, 'Content Model']}
                  />
                )}
                <div
                  style={{
                    display: props.currentTab === 'sidebar_configuration' ? 'block' : 'none'
                  }}>
                  <SidebarConfiguration
                    configuration={props.sidebarConfiguration}
                    extensions={sidebarExtensions}
                    onUpdateConfiguration={props.actions.updateSidebarConfiguration}
                  />
                </div>
              </React.Fragment>
            )}
          </form>
        </div>
        {showSidebar && (
          <div className="workbench-main__sidebar">
            <div className="entity-sidebar entity-sidebar__text-profile">
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
          </div>
        )}
      </div>
    </div>
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
