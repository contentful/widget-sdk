import { ContentType, ContentTypeField, EditorInterfaceControl, Locale } from 'core/typings';
import mitt from 'mitt';
import { useMemo } from 'react';
import { createLocalesApi } from '@contentful/experience-sdk';
import localeStore from 'services/localeStore';
import noop from 'lodash/noop';
import fromPairs from 'lodash/fromPairs';
import { FieldExtensionSDK } from '@contentful/app-sdk';

export type InitialValueFieldProps = {
  contentType: ContentType;
  eventEmitter: mitt.Emitter;
  field: ContentTypeField;
  widget: EditorInterfaceControl;
  locale: Locale;
  locales: Locale[];
  onChange: (fieldName: string, value: unknown) => void;
  fields: { initialValue?: { value: Partial<Record<string, unknown>> } };
};

const cleanObject = (obj: Record<string, unknown>) => {
  const clean = Object.entries(obj).filter(([, value]) => value !== undefined);

  if (clean.length === 0) {
    return undefined;
  }

  return fromPairs(clean);
};

export function useInitialValueFieldAPI({
  eventEmitter,
  contentType,
  field,
  fields,
  widget,
  locale,
  locales,
  onChange,
}: InitialValueFieldProps) {
  const sdk = useMemo(() => {
    const localesApi = createLocalesApi({
      activeLocaleCode: locale.code,
      defaultLocaleCode: localeStore.getDefaultLocale().code,
      list: locales,
    });

    if (typeof field.apiName === 'undefined') {
      throw new Error('Field did not contain the necessary apiName');
    }

    const changeValue = (value: unknown) => {
      const payload = cleanObject({
        ...fields.initialValue?.value,
        [locale.internal_code]: value,
      });

      onChange('initialValue', payload);
      eventEmitter.emit('valueChanged', value);
    };

    return {
      access: {
        // Return `false` to deny access to uploading new assets from the
        // initial value markdown editor
        can: () => Promise.resolve(false),
      },
      field: {
        ...field,
        locale: locale.internal_code,
        getValue: () => fields.initialValue?.value?.[locale.internal_code],
        onIsDisabledChanged: noop,
        onSchemaErrorsChanged: noop,
        onValueChanged: (callback) => {
          eventEmitter.on('valueChanged', callback);

          return () => eventEmitter.off('valueChanged', callback);
        },
        removeValue: async () => changeValue(undefined),
        setInvalid: () => {
          console.log('setInvalid');
        },
        setValue: async (value: unknown) => changeValue(value),
      },
      parameters: {
        installation: {},
        instance: widget.settings ?? {},
      },
      contentType,
      locales: localesApi,

      // entry & space api are specifically for slug editor to not fall over
      entry: {
        fields: {},
        getSys: () => ({ contentType }),
        onSysChanged: noop,
      },
      space: {
        getEntries: () => Promise.resolve({ total: 0 }),
      },
    } as unknown as FieldExtensionSDK;
  }, [
    contentType,
    eventEmitter,
    field,
    fields,
    widget,
    locale.code,
    locale.internal_code,
    locales,
    onChange,
  ]);

  return sdk;
}
