import React, { useCallback, useMemo, useState } from 'react';
import { Field, FieldWrapper } from '@contentful/default-field-editors';
import noop from 'lodash/noop';
import mitt from 'mitt';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import { createLocalesApi } from '@contentful/experience-sdk';
import { css } from 'emotion';
import keyBy from 'lodash/keyBy';

import type { ContentType, ContentTypeField, Locale } from 'core/typings';
import localeStore from 'services/localeStore';
import { useFieldDialogContext } from './FieldDialogContext';
import type { FieldValueChangedHandler } from '../../types';

import type { EditorInterfaceProps } from 'contentful-management/types';

interface UseFieldApi {
  contentType: ContentType;
  editorInterface: EditorInterfaceProps;
  field: ContentTypeField;
  fields: { initialValue?: { value: Partial<Record<'string', unknown>> } };
  locale: Locale;
  locales: Locale[];
  onChange: FieldValueChangedHandler;
  setInvalid: (localeCode: string, isInvalid: boolean) => void;
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

    if (typeof field.apiName === 'undefined') {
      throw new Error('Field did not contain the necessary apiName');
    }

    const instance = keyBy(editorInterface.controls, 'fieldId')[field.apiName];

    return {
      access: {
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
  }, [contentType, editorInterface, emitter, field, fields, locale, locales, onChange, setInvalid]);

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
  editorInterface: any;
  fields: any;
  isLocalized?: boolean;
  locale: any;
  locales: any;
  onChange: FieldValueChangedHandler;
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

  const customfield = (
    <Field
      key={`initialvaluefield_${locale.code}`}
      sdk={sdk}
      widgetId={instance?.widgetId || undefined}
    />
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
