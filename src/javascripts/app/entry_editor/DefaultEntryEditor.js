import React from 'react';
import AngularComponent from 'ui/Framework/AngularComponent';
import NoLocalizedFieldsAdvice from 'components/tabs/NoLocalizedFieldsAdvice';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import ReferencesTab from './EntryReferences';
import { ContentTagsTab } from './EntryContentTags/ContentTagsTab';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { PolicyBuilderConfig } from 'access_control/PolicyBuilder/PolicyBuilderConfig';

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
    noLocalizedFieldsAdviceProps,
    selectedTab,
    onRootReferenceCardClick,
    fieldLocaleListeners,
  }
) {
  const otDoc = getOtDoc();
  const editorData = getEditorData();
  const canEditTags = otDoc.permissions.canEditFieldLocale(
    PolicyBuilderConfig.TAGS,
    PolicyBuilderConfig.PATH_WILDCARD
  );
  const widgetComponents = {
    [EntryEditorWidgetTypes.REFERENCE_TREE.id]: (
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
    ),

    [EntryEditorWidgetTypes.DEFAULT_EDITOR.id]: (
      <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
        <AngularComponent
          template={'<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId" />'}
          scope={{
            widgets,
            editorContext,
            localeData,
            fields,
            loadEvents,
            editorData: getEditorData(),
            fieldLocaleListeners,
            otDoc,
            preferences,
            entityInfo,
          }}
        />
        {noLocalizedFieldsAdviceProps && (
          <NoLocalizedFieldsAdvice {...noLocalizedFieldsAdviceProps} />
        )}
      </div>
    ),

    [EntryEditorWidgetTypes.TAGS_EDITOR.id]: (
      <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
        {selectedTab === `${WidgetNamespace.EDITOR_BUILTIN}-${widgetId}` && (
          <ContentTagsTab
            disable={!canEditTags}
            getValueAt={otDoc.getValueAt}
            setValueAt={otDoc.setValueAt}
          />
        )}
      </div>
    ),
  };

  return widgetComponents[widgetId];
}
