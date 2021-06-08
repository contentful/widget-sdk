import React, { useCallback, useMemo, useState } from 'react';
import { Field, FieldWrapper } from '@contentful/default-field-editors';
import noop from 'lodash/noop';
import mitt from 'mitt';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import { createLocalesApi } from '@contentful/experience-sdk';
import { css } from 'emotion';
import keyBy from 'lodash/keyBy';

import localeStore from 'services/localeStore';
import { useFieldDialogContext } from './FieldDialogContext';

interface UseFieldApi {
  contentType: any;
  editorInterface: any;
  field: any;
  fields: any;
  locale: any;
  locales: any; //Array<{ [key: string]: unknown }>;
  onChange: any;
  setInvalid: any;
}

const useFieldAPI = ({
  contentType,
  editorInterface,
  field,
  fields,
  locale,
  locales,
  onChange,
  setInvalid,
}: UseFieldApi) => {
  const emitter = useMemo(() => mitt(), []);

  const sdk = useMemo(() => {
    const localesApi = createLocalesApi({
      activeLocaleCode: locale.code,
      defaultLocaleCode: localeStore.getDefaultLocale().code,
      list: locales,
    });

    const instance = keyBy(editorInterface.controls, 'fieldId')[field.apiName];

    return {
      access: {
        can: () => Promise.resolve(false),
      },
      field: {
        ...field,
        locale: locale.code,
        getValue: () => {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const [, value] = Object.entries(fields.initialValue.value).find(
              ([key]) => key === locale.code
            );
            return value;
          } catch {
            return undefined;
          }
        },
        onIsDisabledChanged: noop,
        onSchemaErrorsChanged: noop,
        onValueChanged: (callback) => {
          emitter.on('valueChanged', callback);

          return () => emitter.off('valueChanged', callback);
        },
        removeValue: async () => {
          const payload = {
            ...fields.initialValue.value,
            [locale.code]: undefined,
          };

          onChange('initialValue', payload);
          emitter.emit('valueChanged', undefined);
        },
        setInvalid,
        setValue: async (value: unknown) => {
          const payload = {
            ...fields.initialValue?.value,
            [locale.code]: value,
          };

          if (typeof fields.initialValue === 'undefined') {
            fields.initialValue = {};
          }

          // todo: create this initialValue object if it's undefined
          onChange('initialValue', payload);
          emitter.emit('valueChanged', value);
        },
      },
      parameters: {
        installation: {},
        instance: instance ? instance.settings : {},
      },
      contentType,
      locales: localesApi,
    } as unknown as FieldExtensionSDK;
  }, [contentType, editorInterface, emitter, field, fields, locale, locales, onChange, setInvalid]);

  return sdk;
};

export interface InitialValueFieldProps {
  contentType: any;
  editorInterface: any;
  fields: any;
  isLocalized?: boolean;
  locale: any;
  locales: any;
  onChange: any;
}

const InitialValueField = ({
  contentType,
  editorInterface,
  fields,
  isLocalized,
  locale,
  locales,
  onChange,
}: InitialValueFieldProps) => {
  const fieldContext = useFieldDialogContext();
  const [, setInvalidControls] = useState({});
  const instance = useMemo(
    () => keyBy(editorInterface.controls, 'fieldId')[fieldContext.field.apiName],
    [editorInterface, fieldContext.field.apiName]
  );
  const setInvalidLocale = useCallback((localeId, isInvalid) => {
    setInvalidControls((state) => ({
      ...state,
      [localeId]: isInvalid,
    }));
  }, []);

  const sdk = useFieldAPI({
    ...fieldContext,
    contentType,
    editorInterface,
    fields,
    locale,
    locales,
    setInvalid: setInvalidLocale,
    onChange,
  });

  const Customfield = () => {
    return <Field sdk={sdk} widgetId={instance?.widgetId || undefined} />;
  };

  return isLocalized ? (
    <FieldWrapper className={css({ marginLeft: 0, marginRight: 0 })} sdk={sdk} name={locale.name}>
      <Customfield />
    </FieldWrapper>
  ) : (
    <Customfield />
  );
};

export { InitialValueField };
