import React from 'react';
import AngularComponent from 'ui/Framework/AngularComponent';
import NoLocalizedFieldsAdvice from 'components/tabs/NoLocalizedFieldsAdvice';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import { NAMESPACE_EDITOR_BUILTIN } from 'widgets/WidgetNamespaces';
import ReferencesTab from './EntryReferences';

export default function renderDefaultEditor(
  widgetId,
  {
    localeData,
    loadEvents,
    fields,
    entityInfo,
    getOtDoc,
    getEditorData,
    preferences,
    widgets,
    editorContext,
    shouldDisplayNoLocalizedFieldsAdvice,
    noLocalizedFieldsAdviceProps,
    selectedTab,
  }
) {
  const otDoc = getOtDoc();
  const editorData = getEditorData();

  if (widgetId === EntryEditorWidgetTypes.REFERENCE_TREE.id) {
    return (
      <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
        {/*
          We could do return if `selectedTab !== currentTab` at the top of <EntryEditorWorkbench>,
          however, <AngularComponent> doesnt re-render on state change as it involves also
          angularJS. Instead, render it on initial load and conditionally render <ReferencesTab>
        */}
        {selectedTab === `${NAMESPACE_EDITOR_BUILTIN}-${widgetId}` && (
          <ReferencesTab entity={editorData.entity.data} />
        )}
      </div>
    );
  } else if (widgetId === EntryEditorWidgetTypes.DEFAULT_EDITOR.id) {
    return (
      <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
        <AngularComponent
          template={`<cf-error-list
                className="form-box-error"
                cf-error-path="['fields']"></cf-error-list>`}
          scope={{
            widgets,
            editorContext,
            localeData,
            fields,
            editorData,
            otDoc,
            entityInfo,
          }}
        />

        <AngularComponent
          template={'<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId" />'}
          scope={{
            widgets,
            editorContext,
            localeData,
            fields,
            loadEvents,
            editorData: getEditorData(),
            otDoc,
            preferences,
            entityInfo,
          }}
        />
        {shouldDisplayNoLocalizedFieldsAdvice && (
          <NoLocalizedFieldsAdvice {...noLocalizedFieldsAdviceProps} />
        )}
      </div>
    );
  }
}
