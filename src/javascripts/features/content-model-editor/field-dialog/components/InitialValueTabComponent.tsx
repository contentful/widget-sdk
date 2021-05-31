import React, { Fragment } from 'react';
import { Field } from '@contentful/default-field-editors';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import noop from 'lodash/noop';

import TheLocaleStore from 'services/localeStore';
import type { Widget } from 'app/entity_editor/EntityField/types';
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

export interface InitialValueTabComponentProps {
  contentType: any;
  ctField: { localized: boolean; type: string };
  availableWidgets: Widget[];
}

const createFakeFieldAPI = ({ contentType, field, settings, locale, locales }) => {
  const fieldIndex = contentType.fields.findIndex((fieldElement) => fieldElement.id === field.id);

  return {
    field: {
      ...field,
      locale,
      getValue: () => Promise.resolve(false),
      removeValue: () => {},
      setValue: async (value: any) => {
        const newContentType = Object.assign({}, contentType);
        newContentType.fields[fieldIndex] = {
          ...newContentType.fields[fieldIndex],
          initialValue: {
            [locale.code]: value,
          },
        };

        // do something with newContentType
      },
      onSchemaErrorsChanged: noop,
      onIsDisabledChanged: noop,
      onValueChanged: noop,
      isEqualValues: noop,
    },
    parameters: {
      installation: {},
      instance: settings,
    },
    contentType,
    locales,
  } as FieldExtensionSDK;
};

const FieldWithSdk = ({ contentType, locale, locales }) => {
  const fieldContext = useFieldDialogContext();
  const sdk = createFakeFieldAPI({ ...fieldContext, contentType, locale, locales });

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

const InitialValueTabComponent = ({ contentType, ctField }: InitialValueTabComponentProps) => {
  const { fieldSdk, fieldParameters } = useFieldDialogContext();
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);

  if (!isFieldTypeSupported) {
    return (
      <Fragment>
        Initial values are still a work in progress. The type of field you are working with is not
        supported yet.
      </Fragment>
    );
  }

  const locales = TheLocaleStore.getPrivateLocales();

  if (!ctField.localized) {
    return (
      <FieldWithSdk
        contentType={contentType}
        locale={TheLocaleStore.getDefaultLocale()}
        locales={locales}
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
