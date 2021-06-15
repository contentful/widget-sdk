import React, { Fragment, useRef } from 'react';
import { Button, Flex, Note, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import localeStore from 'services/localeStore';
import { InitialValueField } from './InitialValueField';
import type { ContentType, ContentTypeField } from 'core/typings';
import type { FieldValueChangedHandler } from '../../types';
import mitt from 'mitt';
import { InitialValueUsageNote } from './InitialValueUsageNote';
import { Locale } from 'core/typings';
import { confirmAllLocalesAction } from './initialValue/AllLocalesActionConfirm';

export const SUPPORTED_FIELD_TYPES = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Text'];
const MANAGABLE_NUMBER_OF_LOCALES = 4;

const StyleTagHidingMarkdownEditorAssetButton = () => {
  return (
    <style>{`
      button[data-test-id="markdownEditor.linkExistingAssets"] {
        display: none;
      }
      `}</style>
  );
};

export interface InitialValueTabComponentProps {
  contentType: ContentType;
  ctField: ContentTypeField;
  fields: { initialValue?: { value: Partial<Record<'string', unknown>> } };
  onChange: FieldValueChangedHandler;
}

const UnsupportedFieldTypeNote = () => (
  <Flex marginBottom="spacingXl" marginTop="spacingS">
    <Note title="The initial value is not available for this field type.">
      Currently, you can only add initial value for the text, boolean, date and time, and number
      fields.
    </Note>
  </Flex>
);

export const InitialValueTabComponent = ({
  contentType,
  ctField,
  fields,
  onChange,
}: InitialValueTabComponentProps) => {
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);
  const locales: Locale[] = localeStore.getLocales();
  const defaultLocale: Locale = localeStore.getDefaultLocale();
  const otherLocales = locales.filter((locale) => locale.code !== defaultLocale.code);
  const eventEmitters = useRef<Record<string, mitt.Emitter>>(
    Object.fromEntries(locales.map((locale) => [locale.code, mitt()]))
  );

  if (!isFieldTypeSupported) {
    return <UnsupportedFieldTypeNote />;
  }

  const defaultLocaleField = (
    <>
      <StyleTagHidingMarkdownEditorAssetButton />
      <InitialValueField
        contentType={contentType}
        eventEmitter={eventEmitters.current[defaultLocale.code]}
        fields={fields}
        isLocalized={ctField.localized}
        key={defaultLocale.code}
        locale={defaultLocale}
        locales={locales}
        onChange={onChange}
      />
    </>
  );

  const numberOfLocales = locales.length;
  const initialValueForDefaultLocale =
    fields.initialValue?.value && fields.initialValue.value[defaultLocale.code] !== undefined
      ? fields.initialValue.value[defaultLocale.code]
      : undefined;
  const otherLocalesHaveValues =
    fields.initialValue?.value &&
    Object.keys(fields.initialValue.value)
      .filter((localeCode) => localeCode !== defaultLocale.code)
      .some((localeCode) => fields.initialValue?.value[localeCode] !== undefined);

  const applyValueToOtherLocales = (value: unknown) => {
    // Our form value objects prevent adding new keys so we have to create a
    // clone before we can add locales
    const payload = fields.initialValue?.value ? { ...fields.initialValue.value } : {};

    for (const locale of otherLocales) {
      payload[locale.code] = value;

      const emitter = eventEmitters.current[locale.code];
      emitter.emit('valueChanged', value);
    }

    onChange('initialValue', payload);
  };

  const applyAll = async () => {
    if (!otherLocalesHaveValues || (await confirmAllLocalesAction('replace'))) {
      applyValueToOtherLocales(initialValueForDefaultLocale);
    }
  };

  const clearAll = async () => {
    const confirmed = await confirmAllLocalesAction('remove');
    if (!confirmed) {
      return;
    }

    applyValueToOtherLocales(undefined);
  };

  const otherLocaleFields = (
    <>
      {numberOfLocales > MANAGABLE_NUMBER_OF_LOCALES && (
        <Fragment>
          <div>
            <Flex flexDirection="row" marginBottom="spacingXs">
              <Button disabled={initialValueForDefaultLocale === undefined} onClick={applyAll}>
                Apply to all locales
              </Button>
              {initialValueForDefaultLocale !== undefined && (
                <Flex marginLeft="spacingM">
                  <TextLink
                    disabled={!otherLocalesHaveValues}
                    onClick={clearAll}
                    linkType="secondary">
                    Clear all
                  </TextLink>
                </Flex>
              )}
            </Flex>

            <Paragraph>
              All locales will be set to the same initial value as the main locale.
            </Paragraph>
          </div>
        </Fragment>
      )}

      {otherLocales.map((locale) => (
        <InitialValueField
          contentType={contentType}
          eventEmitter={eventEmitters.current[locale.code]}
          fields={fields}
          isLocalized
          key={locale.code}
          locale={locale}
          locales={locales}
          onChange={onChange}
        />
      ))}
    </>
  );

  return (
    <Flex flexDirection="column">
      <InitialValueUsageNote />
      <StyleTagHidingMarkdownEditorAssetButton />
      {defaultLocaleField}
      {ctField.localized && otherLocaleFields}
    </Flex>
  );
};
