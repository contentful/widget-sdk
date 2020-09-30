import { EditorContext, LocaleData, OtDoc, Widget } from 'app/entity_editor/EntityField/types';
import { createFieldLocaleController } from 'app/entity_editor/fieldLocaleController';
import * as K from 'core/utils/kefir';
import { set, isEqual } from 'lodash';

interface FieldLocaleListener {
  fieldId: string;
  localeCode: string;
  onDisabledChanged: (cb: (val: any) => void) => unknown;
  onSchemaErrorsChanged: (cb: (val: any) => void) => unknown;
}

export type FieldLocaleLookup = Record<string, Record<string, FieldLocaleListener>>;

export const makeFieldLocaleListeners = (
  controls: Widget[],
  editorContext: EditorContext,
  localeData: LocaleData,
  otDoc: OtDoc
) => {
  const lookup: FieldLocaleLookup = {};
  const flat: FieldLocaleListener[] = [];

  controls.forEach((widget) => {
    const locales = widget.field.localized ? localeData.privateLocales : [localeData.defaultLocale];

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
