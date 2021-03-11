import * as React from 'react';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import some from 'lodash/some';
import { Widget, Doc, EditorContext, LocaleData, LoadEvents, EditorData } from './types';

import { EntityFieldLocale } from './EntityFieldLocale';
import { FieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';
import { Preferences } from 'app/widgets/ExtensionSDKs/createEditorApi';
import { WidgetNamespace } from '@contentful/widget-renderer';
function updateErrorStatus(field, localeData, validator, invalidControls) {
  const hasSchemaErrors = localeData.isSingleLocaleModeOn
    ? validator.hasFieldLocaleError(field.id, localeData.focusedLocale.internal_code)
    : validator.hasFieldError(field.id);
  const hasControlErrors = some(invalidControls);
  return hasSchemaErrors || hasControlErrors;
}

function getActiveLocales({ field, localeData, validator }) {
  const fieldLocalesInternalCodes = getFieldLocales({ field, localeData }).map(
    (locale) => locale.internal_code
  );
  return localeData.privateLocales.filter((locale) => {
    const isFieldLocale = fieldLocalesInternalCodes.includes(locale.internal_code);
    const isActive = localeData.isLocaleActive(locale);
    const hasError = validator.hasFieldLocaleError(field.id, locale.internal_code);
    return hasError || (isFieldLocale && isActive);
  });
}

function getFieldLocales({ field, localeData }) {
  if (field.localized) {
    return localeData.privateLocales;
  }
  return [localeData.defaultLocale];
}

interface EntityFieldProps {
  widget: Widget;
  index: number;
  localeData: LocaleData;
  editorContext: EditorContext;
  editorData: EditorData;
  fieldLocaleListeners: FieldLocaleListeners;
  loadEvents?: LoadEvents;
  doc: Doc;
  preferences: Preferences;
}

export function EntityField(props: EntityFieldProps) {
  const {
    editorContext,
    editorData,
    fieldLocaleListeners,
    index,
    loadEvents,
    localeData,
    doc,
    preferences,
    widget,
  } = props;
  const { validator } = editorContext;
  const { field, isFocusable, isVisible, widgetId, widgetNamespace } = widget;

  const [invalidControls, setInvalidControls] = React.useState({});
  const [fieldHasFocus, setFieldHasFocus] = React.useState(false);

  const setInvalidLocale = React.useCallback((localeId, isInvalid) => {
    setInvalidControls((state) => ({
      ...state,
      [localeId]: isInvalid,
    }));
  }, []);

  const { isSingleLocaleModeOn, focusedLocale } = localeData;

  const helpText = get(widget, ['settings', 'helpText']);

  const hasInitialFocus = editorContext.hasInitialFocus && index === 0 && isFocusable;

  const fieldLocales = isSingleLocaleModeOn
    ? [focusedLocale]
    : getActiveLocales({ field, localeData, validator });

  const fieldHasErrors = updateErrorStatus(field, localeData, validator, invalidControls);
  const isBuiltInSlugWidget =
    widgetId === 'slugEditor' && widgetNamespace === WidgetNamespace.BUILTIN;

  if (!isVisible && !isBuiltInSlugWidget) {
    return null;
  }

  const sortedFieldLocales = orderBy(fieldLocales || [], ['default', 'name'], ['desc', 'asc']);

  return (
    <div
      className="entity-editor__field-group"
      // eslint-disable-next-line rulesdir/restrict-inline-styles
      style={{ display: isVisible ? 'block' : 'none' }}
      data-test-id="entity-field-controls"
      data-field-id={field.id}
      data-field-api-name={field.apiName}
      data-field-type={field.type}
      data-field-items-type={field.items?.type}
      aria-current={fieldHasFocus}
      aria-invalid={fieldHasErrors}>
      {sortedFieldLocales.map((locale) => {
        return (
          <EntityFieldLocale
            key={`${widget.fieldId}.${locale.internal_code}`}
            doc={doc}
            setFieldHasFocus={setFieldHasFocus}
            editorContext={editorContext}
            editorData={editorData}
            fieldLocaleListeners={fieldLocaleListeners}
            hasInitialFocus={hasInitialFocus}
            loadEvents={loadEvents}
            setInvalid={setInvalidLocale}
            locale={locale}
            localeData={localeData}
            preferences={preferences}
            widget={widget}
            withLocaleName={fieldLocales.length > 1}
          />
        );
      })}
      {helpText && (
        <div className="entity-editor__field-hint" role="note" data-test-id="field-hint">
          {helpText}
        </div>
      )}
    </div>
  );
}
