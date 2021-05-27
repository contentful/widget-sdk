import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Note } from '@contentful/forma-36-react-components';
import { captureError } from 'core/monitoring';

import { EntityFieldHeading } from './EntityFieldHeading';
import { EntityFieldControl } from './EntityFieldControl';
import { Locale, Widget, Doc, EditorContext, LocaleData } from './types';
import { createFieldLocaleController } from '../fieldLocaleController';
import { Preferences } from 'app/widgets/ExtensionSDKs/createEditorApi';

interface EntityFieldLocaleProps {
  doc: Doc;
  editorContext: EditorContext;
  editorData: any;
  fieldLocaleListeners;
  hasInitialFocus: boolean;
  loadEvents: any;
  locale: Locale;
  localeData: LocaleData;
  preferences: Preferences;
  setInvalid: Function;
  setFieldHasFocus: Function;
  widget: Widget;
  withLocaleName: boolean;
}

function ErrorFallback({ error }) {
  React.useEffect(() => {
    captureError(error);
  }, [error]);

  return (
    <Note noteType="warning">
      Something went wrong. This field editor is broken. Reach out to support.
    </Note>
  );
}

export function EntityFieldLocale({
  doc,
  editorContext,
  editorData,
  fieldLocaleListeners,
  hasInitialFocus,
  loadEvents,
  locale,
  localeData,
  preferences,
  setInvalid,
  widget,
  withLocaleName,
  setFieldHasFocus,
}: EntityFieldLocaleProps) {
  const fieldLocale = React.useMemo(
    () =>
      createFieldLocaleController({
        widget,
        editorContext,
        locale,
        otDoc: doc,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onFocus = React.useCallback(() => {
    setFieldHasFocus(true);
  }, [setFieldHasFocus]);

  const onBlur = React.useCallback(() => {
    setFieldHasFocus(false);
    fieldLocale.revalidate();
  }, [fieldLocale, setFieldHasFocus]);

  return (
    <div
      className="entity-editor__field-locale"
      data-test-id={`entity-field-locale-${locale.name}`}
      data-locale={locale.code}>
      <EntityFieldHeading
        field={widget.field}
        locale={locale}
        access={fieldLocale.access}
        entityType={editorContext.entityInfo.type as 'Entry' | 'Asset'}
        withLocaleName={withLocaleName}
      />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <EntityFieldControl
          onFocus={onFocus}
          onBlur={onBlur}
          widget={widget}
          locale={locale}
          editorData={editorData}
          hasInitialFocus={hasInitialFocus}
          doc={doc}
          fieldLocale={fieldLocale}
          loadEvents={loadEvents}
          setInvalid={setInvalid}
          localeData={localeData}
          preferences={preferences}
          fieldLocaleListeners={fieldLocaleListeners}
        />
      </ErrorBoundary>
    </div>
  );
}
