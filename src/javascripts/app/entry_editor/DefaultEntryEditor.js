import React from 'react';
import NoLocalizedFieldsAdvice from 'components/tabs/NoLocalizedFieldsAdvice';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import ReferencesTab from './EntryReferences';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { ContentTagsTab } from 'app/entity_editor/ContentTagsTab';
import { styles } from './styles';
import { EntityField } from 'app/entity_editor/EntityField/EntityField';

export default function renderDefaultEditor(
  widgetId,
  {
    localeData,
    loadEvents,
    fields,
    otDoc,
    editorData,
    preferences,
    widgets,
    editorContext,
    selectedTab,
    onRootReferenceCardClick,
    fieldLocaleListeners,
    noLocalizedFieldsAdviceProps,
  }
) {
  const widgetComponents = {
    [EntryEditorWidgetTypes.REFERENCE_TREE.id]: (
      <div
        className={`${styles.referenceWrapper} cf-workbench-content cf-workbench-content-type__text`}>
        {/*
          We could do return if `selectedTab !== currentTab` at the top of <EntryEditorWorkbench>,
          however, <AngularComponent> doesnt re-render on state change as it involves also
          angularJS. Instead, render it on initial load and conditionally render <ReferencesTab>
        */}
        {selectedTab === `${WidgetNamespace.EDITOR_BUILTIN}-${widgetId}` && (
          <ReferencesTab
            entity={editorData.entity.data}
            onRootReferenceCardClick={onRootReferenceCardClick}
          />
        )}
      </div>
    ),

    [EntryEditorWidgetTypes.DEFAULT_EDITOR.id]: (
      <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
        {widgets.map((widget, index) => (
          <EntityField
            editorContext={editorContext}
            editorData={editorData}
            fieldLocaleListeners={fieldLocaleListeners}
            fields={fields}
            index={index}
            key={widget.fieldId}
            loadEvents={loadEvents}
            localeData={localeData}
            doc={otDoc}
            preferences={preferences}
            widget={widget}
          />
        ))}
        {noLocalizedFieldsAdviceProps && (
          <NoLocalizedFieldsAdvice {...noLocalizedFieldsAdviceProps} />
        )}
      </div>
    ),

    [EntryEditorWidgetTypes.TAGS_EDITOR.id]: (
      <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
        {selectedTab === `${WidgetNamespace.EDITOR_BUILTIN}-${widgetId}` && (
          <ContentTagsTab doc={otDoc} entityType="entry" showEmpty />
        )}
      </div>
    ),
  };

  return widgetComponents[widgetId];
}
