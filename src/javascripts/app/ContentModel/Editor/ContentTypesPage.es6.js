import React from 'react';
import { get } from 'lodash';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import EditorFieldsHeader from './EditorFieldsHeader.es6';
import ContentModelSidebar from './ContentModelSidebar.es6';
import PropTypes from 'prop-types';
import EditorFieldTabs from './EditorFieldTabs.es6';
import FieldsList from './FieldsTab/FieldsList.es6';
import ContentTypePreview from './PreviewTab/ContentTypePreview.es6';
import SidebarConfiguration from 'app/EntrySidebar/Configuration/SidebarConfiguration.es6';

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
            hasCustomSidebarFeature={props.hasCustomSidebarFeature}
          />
          <form name="contentTypeForm" className={styles.form}>
            {props.currentTab === 'fields' && (
              <FieldsList
                displayField={props.contentTypeData.displayField}
                canEdit={props.canEdit}
                fields={props.contentTypeData.fields}
                actions={props.actions}
              />
            )}
            {props.currentTab === 'preview' && (
              <ContentTypePreview
                isDirty={props.isDirty}
                publishedVersion={get(props.contentTypeData, 'sys.publishedVersion')}
                loadPreview={props.actions.loadPreview}
              />
            )}
            {props.hasCustomSidebarFeature && (
              <div
                style={{
                  display: props.currentTab === 'sidebar_configuration' ? 'block' : 'none'
                }}>
                <SidebarConfiguration
                  configuration={props.configuration}
                  extensions={props.extensions}
                  onUpdateConfiguration={props.actions.updateSidebarConfiguration}
                />
              </div>
            )}
          </form>
        </div>
        {showSidebar && (
          <div className="workbench-main__sidebar">
            <ContentModelSidebar
              canEdit={props.canEdit}
              contentTypeId={props.contentTypeData.sys.id}
              fieldsUsed={props.contentTypeData.fields.length}
              showNewFieldDialog={props.actions.showNewFieldDialog}
            />
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
    loadPreview: PropTypes.func.isRequired
  }).isRequired,
  hasCustomSidebarFeature: PropTypes.bool.isRequired,
  configuration: PropTypes.array,
  extensions: PropTypes.array
};
