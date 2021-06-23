import React, { Fragment, useRef } from 'react';
import { Button, Flex, Note, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import localeStore from 'services/localeStore';
import { InitialValueField } from './InitialValueField';
import type { ContentType, ContentTypeField, EditorInterfaceControl } from 'core/typings';
import mitt from 'mitt';
import { InitialValueUsageNote } from './InitialValueUsageNote';
import { Locale } from 'core/typings';
import { confirmAllLocalesAction } from './AllLocalesActionConfirm';

const SUPPORTED_FIELD_TYPES = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Text'];
const MANAGABLE_NUMBER_OF_LOCALES = 4;

const StyleTagHidingUnsupportedMarkdownEditorButtons = () => {
  return (
    <style>{`
      button[data-test-id="markdownEditor.linkExistingAssets"],
      button[data-test-id="markdown-action-button-zen"],
      button[data-test-id="markdown-action-button-link"],
      button[data-test-id="markdown-action-button-embed"],
      button[data-test-id="markdown-action-button-table"],
      button[data-test-id="markdown-action-button-special"],
      button[data-test-id="markdown-action-button-organizeLinks"] {
        display: none;
      }
      `}</style>
  );
};

type InitialValueTabComponentProps = {
  contentType: ContentType;
  ctField: ContentTypeField;
  widget: EditorInterfaceControl;
  fields: { initialValue?: { value: Partial<Record<'string', unknown>> } };
  onChange: (fieldName: string, value: unknown) => void;
};

const UnsupportedFieldTypeNote = () => (
  <Flex marginBottom="spacingXl" marginTop="spacingS">
    <Note title="Not available for this field type">
      Currently, you can only set an initial value for the text, boolean, date and time, and number
      field types.
    </Note>
  </Flex>
);

export const InitialValueTabComponent = ({
  contentType,
  ctField,
  widget,
  fields,
  onChange,
}: InitialValueTabComponentProps) => {
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);
  const locales: Locale[] = localeStore.getLocales();
  const defaultLocale: Locale = localeStore.getDefaultLocale();
  const otherLocales = locales.filter(
    (locale) => locale.internal_code !== defaultLocale.internal_code
  );
  const eventEmitters = useRef<Record<string, mitt.Emitter>>(
    Object.fromEntries(locales.map((locale) => [locale.internal_code, mitt()]))
  );

  if (!isFieldTypeSupported) {
    return <UnsupportedFieldTypeNote />;
  }

  const defaultLocaleField = (
    <>
      <InitialValueField
        widget={widget}
        field={ctField}
        contentType={contentType}
        eventEmitter={eventEmitters.current[defaultLocale.internal_code]}
        fields={fields}
        isLocalized={ctField.localized}
        key={defaultLocale.internal_code}
        locale={defaultLocale}
        locales={locales}
        onChange={onChange}
      />
    </>
  );

  const numberOfLocales = locales.length;
  const initialValueForDefaultLocale = fields.initialValue?.value?.[defaultLocale.internal_code];
  const otherLocalesHaveValues = Object.entries(fields.initialValue?.value ?? {})
    .filter(([localeCode]) => localeCode !== defaultLocale.internal_code)
    .some(([, value]) => value !== undefined);

  const applyValueToOtherLocales = (value: unknown) => {
    // Our form value objects prevent adding new keys so we have to create a
    // clone before we can add locales
    const payload = fields.initialValue?.value ? { ...fields.initialValue.value } : {};

    for (const locale of otherLocales) {
      if (value === undefined) {
        delete payload[locale.internal_code];
      } else {
        payload[locale.internal_code] = value;
      }

      const emitter = eventEmitters.current[locale.internal_code];
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
              All locales will use the same initial value as the default locale.
            </Paragraph>
          </div>
        </Fragment>
      )}

      {otherLocales.map((locale) => (
        <InitialValueField
          eventEmitter={eventEmitters.current[locale.internal_code]}
          contentType={contentType}
          field={ctField}
          widget={widget}
          fields={fields}
          isLocalized
          key={locale.internal_code}
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
      <StyleTagHidingUnsupportedMarkdownEditorButtons />
      {defaultLocaleField}
      {ctField.localized && otherLocaleFields}
    </Flex>
  );
};
