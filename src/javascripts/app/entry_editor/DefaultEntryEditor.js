/* eslint-disable react/prop-types */

import React from 'react';
import AngularComponent from 'ui/Framework/AngularComponent';
import NoLocalizedFieldsAdvice from 'components/tabs/NoLocalizedFieldsAdvice';

import ReferencesTab from './EntryReferences';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { ContentTagsTab } from 'app/entity_editor/ContentTagsTab';
import { styles } from './styles';
import { EntityField } from 'app/entity_editor/EntityField/EntityField';

export const DefaultTagsTab = React.memo(function DefaultTagsTab({ otDoc, selectedTab, widgetId }) {
  return (
    <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
      {selectedTab === `${WidgetNamespace.EDITOR_BUILTIN}-${widgetId}` && (
        <ContentTagsTab doc={otDoc} entityType="entry" showEmpty />
      )}
    </div>
  );
});

export const DefaultReferenceTab = React.memo(function DefaultReferenceTab({
  editorData,
  widgetId,
  selectedTab,
  onRootReferenceCardClick,
}) {
  return (
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
  );
});

export const DefaultEntryEditorTab = React.memo(function DefaultEntryEditorTab({
  localeData,
  loadEvents,
  fields,
  entityInfo,
  otDoc,
  editorData,
  preferences,
  widgets,
  editorContext,
  fieldLocaleListeners,
  noLocalizedFieldsAdviceProps,
  migratedEntityFieldEnabled,
}) {
  return (
    <div className="entity-editor-form cf-workbench-content cf-workbench-content-type__text">
      {migratedEntityFieldEnabled ? (
        widgets.map((widget, index) => (
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
        ))
      ) : (
        <AngularComponent
          with$Apply
          template={'<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId" />'}
          scope={{
            widgets,
            editorContext,
            localeData,
            fields,
            loadEvents,
            editorData,
            fieldLocaleListeners,
            otDoc,
            preferences,
            entityInfo,
          }}
        />
      )}
      {noLocalizedFieldsAdviceProps && (
        <NoLocalizedFieldsAdvice {...noLocalizedFieldsAdviceProps} />
      )}
    </div>
  );
});
