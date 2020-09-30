import React from 'react';
import AngularComponent from 'ui/Framework/AngularComponent';
import NoLocalizedFieldsAdvice from 'components/tabs/NoLocalizedFieldsAdvice';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import ReferencesTab from './EntryReferences';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { makeFieldLocaleListeners } from './makeFieldLocaleListeners';

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
    onRootReferenceCardClick,
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
        {selectedTab === `${WidgetNamespace.EDITOR_BUILTIN}-${widgetId}` && (
          <ReferencesTab
            entity={editorData.entity.data}
            onRootReferenceCardClick={onRootReferenceCardClick}
          />
        )}
      </div>
    );
  } else if (widgetId === EntryEditorWidgetTypes.DEFAULT_EDITOR.id) {
    return (
      <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
        <AngularComponent
          template={`
            <div ng-init="fieldLocaleListeners = makeFieldLocaleListeners(this)">
              <cf-entity-field ng-repeat="widget in widgets track by widget.fieldId" />
            </div>
          `}
          scope={{
            widgets,
            editorContext,
            localeData,
            fields,
            loadEvents,
            editorData: getEditorData(),
            makeFieldLocaleListeners: (currentScope) =>
              makeFieldLocaleListeners(
                editorData.fieldControls.all,
                currentScope.editorContext,
                currentScope.localeData,
                currentScope.otDoc
              ),
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
