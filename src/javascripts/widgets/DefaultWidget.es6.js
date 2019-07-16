import { toInternalFieldType } from './FieldTypes.es6';

const DROPDOWN_TYPES = ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'];

export const DEFAULTS = {
  Text: 'markdown',
  Symbol: 'singleLine',
  Integer: 'numberEditor',
  Number: 'numberEditor',
  Boolean: 'boolean',
  Date: 'datePicker',
  Location: 'locationEditor',
  Object: 'objectEditor',
  RichText: 'richTextEditor',
  Entry: 'entryLinkEditor',
  Asset: 'assetLinkEditor',
  Symbols: 'listInput',
  Entries: 'entryLinksEditor',
  Assets: 'assetLinksEditor',
  File: 'fileEditor'
};

/*
 * Gets the default widget ID for a field:
 * - If a field allows predefined values then `dropdown` widget is used
 *   in the presence of the `in` validation.
 * - If a Text field is a title then the `singleLine` widget is used.
 * - Otherwise a simple type-to-editor mapping is used.
 */
export default function getDefaultWidgetId(field, displayFieldId) {
  const fieldType = toInternalFieldType(field);

  const hasInValidation = (field.validations || []).find(v => 'in' in v);

  if (hasInValidation && DROPDOWN_TYPES.includes(fieldType)) {
    return 'dropdown';
  }

  const isTextField = fieldType === 'Text';
  const isDisplayField = field.id === displayFieldId;

  if (isTextField && isDisplayField) {
    return 'singleLine';
  }

  return DEFAULTS[fieldType];
}
