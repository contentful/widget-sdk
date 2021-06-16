import { extractFieldValidations } from './validationDecorator';
import {
  extractRichTextNodesValidations,
  getEnabledRichTextOptions,
  groupValidations,
} from './helpers';
import { isEmpty } from 'lodash';

export function getUpdatedField(updatedFieldOptions, field, contentType) {
  const [fieldOptions, richTextOptions, widgetSettings] = updatedFieldOptions;

  const {
    isTitle,
    name,
    apiName,
    initialValue,
    localized,
    required,
    assetHyperlinkSize,
    embeddedAssetBlockSize,
    embeddedEntryBlockLinkContentType,
    embeddedEntryBlockSize,
    embeddedEntryInlineLinkContentType,
    embeddedEntryInlineSize,
    entryHyperlinkLinkContentType,
    entryHyperlinkSize,
    ...validationFields
  } = fieldOptions;

  const { itemValidations, baseValidations } = groupValidations(validationFields);

  if (isTitle) {
    contentType.displayField = field.id;
  }

  const isRichText = field.type === 'RichText';

  let fieldValidations = [...extractFieldValidations(baseValidations)];

  // only add RichText node validations to a RichText field
  if (isRichText) {
    const options = getEnabledRichTextOptions(richTextOptions);
    const nodeValidations = extractRichTextNodesValidations({
      assetHyperlinkSize,
      embeddedAssetBlockSize,
      embeddedEntryBlockLinkContentType,
      embeddedEntryBlockSize,
      embeddedEntryInlineLinkContentType,
      embeddedEntryInlineSize,
      entryHyperlinkLinkContentType,
      entryHyperlinkSize,
    });
    fieldValidations = [...fieldValidations, ...options, nodeValidations];
  }

  if (!isEmpty(itemValidations)) {
    field.items.validations = [...extractFieldValidations(itemValidations)];
  }

  // update field on scope with data from React component
  const updatedField = {
    ...field,
    name,
    apiName,
    initialValue,
    localized,
    required,
    validations: fieldValidations,
  };

  return { updatedField, widgetSettings };
}
