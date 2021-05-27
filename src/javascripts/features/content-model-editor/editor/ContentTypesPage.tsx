import React, { useEffect } from 'react';
import { css } from 'emotion';
import { isEqual } from 'lodash';
import { Flex, Workbench } from '@contentful/forma-36-react-components';
import { ContentTypePageActions } from './ContentTypePageActions';
import { EditorFieldTabs, TABS } from './EditorFieldTabs';
import { FieldsList } from './FieldsTab/FieldsList';
import { ContentTypePreview } from './PreviewTab/ContentTypePreview';
import SidebarConfiguration from 'app/EntrySidebar/Configuration/SidebarConfiguration';
import { EntryEditorConfig } from './EntryEditorConfigurationTab/EntryEditorConfig';
import { getEntryConfiguration } from 'app/entry_editor/DefaultConfiguration';
import type { SpaceData } from 'app/entry_editor/DefaultConfiguration';
import DocumentTitle from 'components/shared/DocumentTitle';
import { WidgetLocation } from '@contentful/widget-renderer';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { useCreateActions } from 'features/content-model-editor';
import { openCreateDialog } from './Utils';
import * as accessChecker from 'access_control/AccessChecker';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { LoadingState } from 'features/loading-state';
import {
  ContentTypeIdSection,
  DocumentationSection,
  EntryEditorSection,
  FieldsSection,
} from './Sidebar';
import { UnsavedChangesBlocker } from 'app/common/UnsavedChangesDialog';

const styles = {
  loaderWrapper: css({
    height: '100%',
  }),
};

function isEntryEditorWidget(widget) {
  return widget.locations?.includes(WidgetLocation.ENTRY_EDITOR);
}

type Props = {
  isNew?: boolean;
  contentTypeId?: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
};

export function ContentTypesPage(props: Props) {
  const {
    currentOrganizationId: organizationId,
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
  } = useSpaceEnvContext();

  const spaceData = { organizationId, spaceId, environmentId } as SpaceData;
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
    if (props.isNew && state.contentType && actions.setContentType) {
      openCreateDialog(contentTypeIds, state.contentType, actions.setContentType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (!state.contentType.fields) {
    return (
      <Flex className={styles.loaderWrapper}>
        <LoadingState />
      </Flex>
    );
  }

  return (
    <Workbench>
      <Workbench.Header
        title={state.contentType.name}
        icon={<ProductIcon icon="ContentModel" size="large" color="positive" />}
        description={state.contentType.description}
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
          fieldsCount={state.contentType.fields.length}
          currentTab={props.currentTab}
          setCurrentTab={props.setCurrentTab}
          hasAdvancedExtensibility={hasAdvancedExtensibility}
        />
        <form name="contentTypeForm">
          {props.currentTab === TABS.fields && (
            <React.Fragment>
              <DocumentTitle title={[state.contentType.name, 'Content Model']} />
              <FieldsList
                displayField={state.contentType.displayField}
                canEdit={canEdit}
                fields={state.contentType.fields}
                actions={actions}
              />
            </React.Fragment>
          )}
          {props.currentTab === TABS.preview && (
            <React.Fragment>
              <DocumentTitle title={['Preview', state.contentType.name, 'Content Model']} />
              <ContentTypePreview
                isDirty={state.contextState.dirty}
                contentTypeData={state.contentType}
              />
            </React.Fragment>
          )}
          {hasAdvancedExtensibility && props.currentTab === TABS.sidebarConfiguration && (
            <React.Fragment>
              <DocumentTitle
                title={['Sidebar Configuration', state.contentType.name, 'Content Model']}
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
          {hasAdvancedExtensibility && props.currentTab === TABS.entryEditorConfiguration && (
            <>
              <DocumentTitle title={['Entry editors', state.contentType.name, 'Content Model']} />
              <div>
                <EntryEditorConfig
                  // @ts-expect-error widgetNamespace type mismatch
                  configuration={state.editorInterface.editors || []}
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
              fieldsUsed={state.contentType.fields.length}
            />
            {!props.isNew && <EntryEditorSection contentTypeId={state.contentType.sys.id} />}
            {!props.isNew && <ContentTypeIdSection contentTypeId={state.contentType.sys.id} />}
            <DocumentationSection />
          </div>
        </Workbench.Sidebar>
      )}

      {state.contextState.dirty && <UnsavedChangesBlocker save={actions.saveAndClose} when />}
    </Workbench>
  );
}
