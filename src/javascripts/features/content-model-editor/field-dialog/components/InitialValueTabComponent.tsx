import React, { Fragment } from 'react';
import { Field } from '@contentful/default-field-editors';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import noop from 'lodash/noop';
import mitt from 'mitt';

import localeStore from 'services/localeStore';
import { useFieldDialogContext } from './FieldDialogContext';

export const SUPPORTED_FIELD_TYPES = [
  // 'Array',
  'Boolean',
  // 'Date',
  // 'Integer',
  // 'Number',
  // 'Symbol',
  // 'Text',
];

const createFakeFieldAPI = ({
  contentType,
  field,
  fields,
  instance,
  locale,
  locales,
  onChange,
}) => {
  // const fieldIndex = contentType.fields.findIndex((fieldElement) => fieldElement.id === field.id);
  const emitter = mitt();

  return {
    field: {
      ...field,
      locale,
      getValue: () => {
        const [, value] = Object.entries(fields.initialValue.value).find(
          ([key]) => key === locale.code
        );

        return value;
      },
      removeValue: async () => {
        const payload = {
          ...fields.initialValue.value,
          [locale.code]: undefined,
        };
        onChange('initialValue', payload);
        emitter.emit('valueChanged', undefined);
      },
      setValue: async (value: unknown) => {
        const payload = {
          ...fields.initialValue.value,
          [locale.code]: value,
        };

        onChange('initialValue', payload);
        emitter.emit('valueChanged', value);
      },
      onSchemaErrorsChanged: noop,
      onIsDisabledChanged: noop,
      onValueChanged: (callback) => {
        emitter.on('valueChanged', callback);

        return () => emitter.off('valueChanged', callback);
      },
      isEqualValues: noop,
    },
    parameters: {
      installation: {},
      instance,
    },
    contentType,
    locales,
  } as FieldExtensionSDK;
};

const FieldWithSdk = ({ contentType, fields, locale, locales, onChange }) => {
  const fieldContext = useFieldDialogContext();
  const sdk = createFakeFieldAPI({
    ...fieldContext,
    contentType,
    fields,
    locale,
    locales,
    onChange,
  });

  return <Field sdk={sdk} />;
};

const LocalisedField = ({ contentType, locale, locales }) => {
  return (
    <>
      <div>{locale}</div>
      <FieldWithSdk contentType={contentType} locale={locale} locales={locales} />
    </>
  );
};

export interface InitialValueTabComponentProps {
  contentType: Record<'string', unknown>;
  ctField: { id: string; localized: boolean; type: string };
  fields: Record<'string', unknown>;
  onChange: () => unknown;
}

const InitialValueTabComponent = ({
  contentType,
  ctField,
  fields,
  onChange,
}: InitialValueTabComponentProps) => {
  // const { fieldSdk, fieldParameters } = useFieldDialogContext();
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);
  if (!isFieldTypeSupported) {
    return (
      <Fragment>
        Initial values are still a work in progress. The type of field you are working with is not
        supported yet.
      </Fragment>
    );
  }

  const locales = localeStore.getPrivateLocales();
  // const enhancedCtField = fields.find((element) => element.id === ctField.id);

  if (!ctField.localized) {
    const defaultLocale = localeStore.getDefaultLocale();
    return (
      <FieldWithSdk
        contentType={contentType}
        fields={fields}
        locale={defaultLocale}
        locales={locales}
        onChange={onChange}
      />
    );
  }

  return (
    <>
      {locales.map((locale) => (
        <LocalisedField
          contentType={contentType}
          key={locale.code}
          locale={locale.code}
          locales={locales}
        />
      ))}
    </>
  );
};

export { InitialValueTabComponent };
