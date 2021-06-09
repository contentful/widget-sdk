import React, { Fragment, useCallback, useState } from 'react';
import {
  Button,
  Flex,
  Modal,
  Note,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';
import localeStore from 'services/localeStore';
import { InitialValueField } from './InitialValueField';
import { ContentType, ContentTypeField } from 'core/typings';
import type { FieldValueChangedHandler } from '../../types';
import { useInitialValueDocument } from './useInitialValueDocument';
import { useInitialValueDocumentErrors } from './useInitialValueDocumentErrors';

export const SUPPORTED_FIELD_TYPES = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Text'];

const MANAGABLE_NUMBER_OF_LOCALES = 1;

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
  editorInterface: any;
  fields: { initialValue?: { value: Record<'string', unknown> } };
  onChange: FieldValueChangedHandler;
}

const InitialValueTabComponent = ({
  contentType,
  editorInterface,
  ctField,
  fields,
  onChange,
}: InitialValueTabComponentProps) => {
  const [isModalShown, setIsModalShown] = useState(false);
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);
  const locales = localeStore.getLocales();
  const defaultLocale = localeStore.getDefaultLocale();

  const { doc, validator } = useInitialValueDocument(ctField, fields, contentType, locales);
  const onFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      void doc.setValueAt(['fields', ctField.id], value);
      onChange(fieldName, value);
    },
    [onChange, ctField, fields]
  );
  const { errors } = useInitialValueDocumentErrors(validator);

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

  const otherLocales = locales.filter((locale) => locale.code !== defaultLocale.code);
  const ErrorNote = () => (
    <Flex marginBottom="spacingS" marginTop="spacingS">
      <Note title="Entry may not be publishable" noteType="warning">
        The values you have chosen fail one or more validations and therefore newly created entries
        for this content type can not be published.
      </Note>
    </Flex>
  );

  const DefaultLocaleField = () => (
    <>
      <StyleTagHidingMarkdownEditorAssetButton />
      <InitialValueField
        contentType={contentType}
        editorInterface={editorInterface}
        fields={fields}
        isLocalized={ctField.localized}
        locale={defaultLocale}
        locales={locales}
        onChange={onFieldChange}
      />
    </>
  );

  const OtherLocaleFields = () => (
    <>
      {numberOfLocales > MANAGABLE_NUMBER_OF_LOCALES && (
        <Fragment>
          <Modal isShown={isModalShown} onClose={() => setIsModalShown(false)}>
            {() => (
              <Fragment>
                <Modal.Header title="You are replacing initial values" />
                <Modal.Content>
                  Applying the same initial value to all locales will replace the values you have
                  already set.
                </Modal.Content>
                <Modal.Controls>
                  <Button
                    buttonType="negative"
                    onClick={() => {
                      applyValueToOtherLocales(initialValueForDefaultLocale);
                      setIsModalShown(false);
                    }}>
                    Replace
                  </Button>
                  <Button buttonType="muted" onClick={() => setIsModalShown(false)}>
                    Cancel
                  </Button>
                </Modal.Controls>
              </Fragment>
            )}
          </Modal>
          <div>
            <Flex flexDirection="row" marginBottom="spacingXs">
              <Button
                disabled={initialValueForDefaultLocale === undefined}
                onClick={() => {
                  if (otherLocalesHaveValues) {
                    setIsModalShown(true);
                  } else {
                    applyValueToOtherLocales(initialValueForDefaultLocale);
                  }
                }}>
                Apply to all locales
              </Button>
              {initialValueForDefaultLocale !== undefined && (
                <Flex marginLeft="spacingM">
                  <TextLink
                    disabled={!otherLocalesHaveValues}
                    onClick={() => {
                      applyValueToOtherLocales(undefined);
                    }}
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
          editorInterface={editorInterface}
          fields={fields}
          isLocalized
          key={locale.code}
          locale={locale}
          locales={locales}
          onChange={onFieldChange}
        />
      ))}
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
    const payload = fields.initialValue?.value ?? {};

    for (const locale of otherLocales) {
      payload[locale.code] = value;
    }

    onFieldChange('initialValue', payload);
  };

  return (
    <Flex flexDirection="column">
      {errors.length > 0 && <ErrorNote />}
      <StyleTagHidingMarkdownEditorAssetButton />
      <DefaultLocaleField />
      {ctField.localized && <OtherLocaleFields />}
    </Flex>
  );
};

export { InitialValueTabComponent };
