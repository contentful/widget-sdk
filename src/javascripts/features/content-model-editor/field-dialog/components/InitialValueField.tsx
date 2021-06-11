import React, { useCallback, useMemo, useState } from 'react';
import { Field, FieldWrapper } from '@contentful/default-field-editors';
import noop from 'lodash/noop';
import mitt from 'mitt';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import { createLocalesApi } from '@contentful/experience-sdk';
import { css } from 'emotion';

import type { ContentType, ContentTypeField, EditorInterfaceControl, Locale } from 'core/typings';
import localeStore from 'services/localeStore';
import { useFieldDialogContext } from './FieldDialogContext';
import type { FieldValueChangedHandler } from '../../types';

interface UseFieldApi {
  contentType: ContentType;
  field: ContentTypeField;
  fields: { initialValue?: { value: Partial<Record<'string', unknown>> } };
  instance: EditorInterfaceControl | undefined;
  locale: Locale;
  locales: Locale[];
  onChange: FieldValueChangedHandler;
  setInvalid: (localeCode: string, isInvalid: boolean) => void;
}

const useFieldAPI = ({
  contentType,
  field,
  fields,
  instance,
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

    if (typeof field.apiName === 'undefined') {
      throw new Error('Field did not contain the necessary apiName');
    }

    return {
      access: {
        // Return `false` to deny access to uploading new assets from the
        // initial value markdown editor
        can: () => Promise.resolve(false),
      },
      field: {
        ...field,
        locale: locale.code,
        getValue: () => fields.initialValue?.value?.[locale.code],
        onIsDisabledChanged: noop,
        onSchemaErrorsChanged: noop,
        onValueChanged: (callback) => {
          emitter.on('valueChanged', callback);

          return () => emitter.off('valueChanged', callback);
        },
        removeValue: async () => {
          const payload = {
            ...fields.initialValue?.value,
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
            fields.initialValue = { value: {} };
          }

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
  }, [contentType, emitter, field, fields, instance, locale.code, locales, onChange, setInvalid]);

  return sdk;
};

const styles = {
  fieldWrapper: css({
    marginLeft: 0,
    marginRight: 0,

    '& + &': {
      marginTop: 0,
    },
  }),
};

export interface InitialValueFieldProps {
  contentType: UseFieldApi['contentType'];
  fields: UseFieldApi['fields'];
  isLocalized?: boolean;
  locale: Locale;
  locales: UseFieldApi['locales'];
  onChange: FieldValueChangedHandler;
}

const InitialValueField = ({
  contentType,
  fields,
  isLocalized,
  locale,
  locales,
  onChange,
}: InitialValueFieldProps) => {
  const fieldContext = useFieldDialogContext();
  const [, setInvalidControls] = useState({});
  const setInvalidLocale = useCallback((localeId, isInvalid) => {
    setInvalidControls((state) => ({
      ...state,
      [localeId]: isInvalid,
    }));
  }, []);

  const sdk = useFieldAPI({
    ...fieldContext,
    contentType,
    fields,
    locale,
    locales,
    setInvalid: setInvalidLocale,
    onChange,
  });

  const customfield = (
    <Field key={locale.code} sdk={sdk} widgetId={fieldContext.instance?.widgetId || undefined} />
  );

  return isLocalized ? (
    <FieldWrapper className={styles.fieldWrapper} sdk={sdk} name={locale.name}>
      {customfield}
    </FieldWrapper>
  ) : (
    customfield
  );
};

export { InitialValueField };
