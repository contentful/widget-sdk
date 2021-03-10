import { useMemo } from 'react';
import { EditorContext, Locale, Doc, Widget } from 'app/entity_editor/EntityField/types';
import { createFieldLocaleController } from 'app/entity_editor/fieldLocaleController';
import * as K from 'core/utils/kefir';
import { set, isEqual } from 'lodash';

export interface FieldLocaleListener {
  fieldId: string;
  localeCode: string;
  onDisabledChanged: (cb: (val: any) => void) => unknown;
  onSchemaErrorsChanged: (cb: (val: any) => void) => unknown;
}

export type FieldLocaleLookup = Record<string, Record<string, FieldLocaleListener>>;

export type FieldLocaleListeners = {
  lookup: FieldLocaleLookup;
  flat: FieldLocaleListener[];
};

export const makeFieldLocaleListeners = (
  controls: Widget[],
  editorContext: EditorContext,
  privateLocales: Locale[],
  defaultLocale: Locale,
  otDoc: Doc
): FieldLocaleListeners => {
  const lookup: FieldLocaleLookup = {};
  const flat: FieldLocaleListener[] = [];

  if (!defaultLocale) return { lookup, flat };

  controls.forEach((widget) => {
    // Ideally we would be selecting for just the relevant locales, but we
    // should nevertheless set up controllers for each locale because there
    // are circumstances in which validation failures in otherwise
    // inaccessible locales would not be editable. For context, see e.g.
    // https://contentful.atlassian.net/browse/PEN-1574
    privateLocales.forEach((locale) => {
      const fieldId = widget.fieldId;
      const localeCode = locale.code;

      const { access$, errors$ } = createFieldLocaleController({
        widget,
        locale,
        otDoc,
        editorContext,
      });

      const fieldLocale: FieldLocaleListener = {
        fieldId,
        localeCode,
        onDisabledChanged: (cb) => K.onValue(access$, (access: any) => cb(!!access.disabled)),
        onSchemaErrorsChanged: (cb) =>
          K.onValue(errors$.skipDuplicates(isEqual), (errors = []) => cb(errors)),
      };

      set(lookup, [fieldId, localeCode], fieldLocale);
      flat.push(fieldLocale);
    });
  });

  return { lookup, flat };
};

export const useFieldLocaleListeners = (
  controls: Widget[],
  editorContext: EditorContext,
  privateLocales: Locale[],
  defaultLocale: Locale,
  otDoc: Doc
) => {
  return useMemo(
    () => makeFieldLocaleListeners(controls, editorContext, privateLocales, defaultLocale, otDoc),
    [controls, defaultLocale, editorContext, otDoc, privateLocales]
  );
};
