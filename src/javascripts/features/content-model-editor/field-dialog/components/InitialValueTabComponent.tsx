import React from 'react';
import { Flex, Note } from '@contentful/forma-36-react-components';

import localeStore from 'services/localeStore';
import { InitialValueField } from './InitialValueField';

export const SUPPORTED_FIELD_TYPES = [
  // 'Array',
  'Boolean',
  'Date',
  'Integer',
  'Number',
  'Symbol',
  // 'Text',
];

export interface InitialValueTabComponentProps {
  contentType: Record<'string', unknown>;
  ctField: { id: string; localized: boolean; type: string };
  editorInterface: any;
  fields: Record<'string', unknown>;
  onChange: () => unknown;
}

const InitialValueTabComponent = ({
  contentType,
  editorInterface,
  ctField,
  fields,
  onChange,
}: InitialValueTabComponentProps) => {
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);

  if (!isFieldTypeSupported) {
    return (
      <Flex marginBottom="spacingXl" marginTop="spacingS">
        <Note title="The initial value is not available for this field type.">
          Currently, you can only add initial value for the text, boolean, date and time, and number
          fields.
        </Note>
      </Flex>
    );
  }

  const locales = localeStore.getLocales();

  if (!ctField.localized) {
    const defaultLocale = localeStore.getDefaultLocale();

    return (
      <InitialValueField
        contentType={contentType}
        editorInterface={editorInterface}
        fields={fields}
        locale={defaultLocale}
        locales={locales}
        onChange={onChange}
      />
    );
  }

  return (
    <Flex flexDirection="column">
      {locales.map((locale) => (
        <InitialValueField
          contentType={contentType}
          editorInterface={editorInterface}
          fields={fields}
          isLocalized
          key={locale.code}
          locale={locale}
          locales={locales}
          onChange={onChange}
        />
      ))}
    </Flex>
  );
};

export { InitialValueTabComponent };
