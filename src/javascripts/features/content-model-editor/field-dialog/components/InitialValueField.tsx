import React, { useMemo } from 'react';
import { Field, FieldWrapper } from '@contentful/default-field-editors';
import noop from 'lodash/noop';
import type mitt from 'mitt';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import { createLocalesApi } from '@contentful/experience-sdk';
import { css } from 'emotion';

import type { ContentType, ContentTypeField, EditorInterfaceControl, Locale } from 'core/typings';
import localeStore from 'services/localeStore';
import { useFieldDialogContext } from './FieldDialogContext';
import type { FieldValueChangedHandler } from '../../types';

interface UseFieldApi {
  contentType: ContentType;
  eventEmitter: mitt.Emitter;
  field: ContentTypeField;
  fields: { initialValue?: { value: Partial<Record<'string', unknown>> } };
  instance: EditorInterfaceControl | undefined;
  locale: Locale;
  locales: Locale[];
  onChange: FieldValueChangedHandler;
}

const useFieldAPI = ({
  contentType,
  eventEmitter,
  field,
  fields,
  instance,
  locale,
  locales,
  onChange,
}: // setInvalid,
UseFieldApi) => {
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
        locale: locale.internal_code,
        getValue: () => {
          return fields.initialValue?.value?.[locale.internal_code];
        },
        onIsDisabledChanged: noop,
        onSchemaErrorsChanged: noop,
        onValueChanged: (callback) => {
          eventEmitter.on('valueChanged', callback);

          return () => eventEmitter.off('valueChanged', callback);
        },
        removeValue: async () => {
          const payload = {
            ...fields.initialValue?.value,
            [locale.internal_code]: undefined,
          };

          onChange('initialValue', payload);
          eventEmitter.emit('valueChanged', undefined);
        },
        setInvalid: noop,
        setValue: async (value: unknown) => {
          const payload = {
            ...fields.initialValue?.value,
            [locale.internal_code]: value,
          };

          if (typeof fields.initialValue === 'undefined') {
            fields.initialValue = { value: {} };
          }

          onChange('initialValue', payload);
          eventEmitter.emit('valueChanged', value);
        },
      },
      parameters: {
        installation: {},
        instance: instance ? instance.settings : {},
      },
      contentType,
      locales: localesApi,
    } as unknown as FieldExtensionSDK;
  }, [
    contentType,
    eventEmitter,
    field,
    fields,
    instance,
    locale.code,
    locale.internal_code,
    locales,
    onChange,
  ]);

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
  eventEmitter: mitt.Emitter;
  fields: UseFieldApi['fields'];
  isLocalized?: boolean;
  locale: Locale;
  locales: UseFieldApi['locales'];
  onChange: FieldValueChangedHandler;
}

const InitialValueField = ({
  contentType,
  eventEmitter,
  fields,
  isLocalized,
  locale,
  locales,
  onChange,
}: InitialValueFieldProps) => {
  const fieldContext = useFieldDialogContext();
  const sdk = useFieldAPI({
    ...fieldContext,
    contentType,
    eventEmitter,
    fields,
    locale,
    locales,
    onChange,
  });

  const customfield = (
    <Field
      key={locale.internal_code}
      sdk={sdk}
      widgetId={fieldContext.instance?.widgetId || undefined}
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
