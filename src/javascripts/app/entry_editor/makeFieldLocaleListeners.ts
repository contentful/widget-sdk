import { useMemo } from 'react';
import { EditorContext, Locale, OtDoc, Widget } from 'app/entity_editor/EntityField/types';
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

export const makeFieldLocaleListeners = (
  controls: Widget[],
  editorContext: EditorContext,
  privateLocales: Locale[],
  defaultLocale: Locale,
  otDoc: OtDoc
) => {
  const lookup: FieldLocaleLookup = {};
  const flat: FieldLocaleListener[] = [];

  if (!defaultLocale) return { lookup, flat };

  controls.forEach((widget) => {
    const locales = widget.field.localized ? privateLocales : [defaultLocale];

    locales.forEach((locale) => {
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
  otDoc: OtDoc
) => {
  return useMemo(
    () => makeFieldLocaleListeners(controls, editorContext, privateLocales, defaultLocale, otDoc),
    [controls, defaultLocale, editorContext, otDoc, privateLocales]
  );
};
