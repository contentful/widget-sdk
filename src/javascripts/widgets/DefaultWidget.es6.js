import { toInternalFieldType } from './FieldTypes.es6';

// TODO: right now defaults live in this module because
// we need to share our internal widget IDs with
// content_api. As proposed in CEP-0074 we should make
// content_api unaware of our internal IDs and move
// the mapping into the user_interface repository.
import widgetMap from '@contentful/widget-map';

const DROPDOWN_TYPES = ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'];

/*
 * Gets the default widget ID for a field.
 *
 * Uses @contentful/widget-map to determine the value.
 * But it also handles two special scenarios:
 * - If a field type we deal with is "File", we use the builtin file
 *   editor (assets editor only).
 * - If a field allows predefined values then `dropdown` widget is used
 *   in the presence of the `in` validation.
 * - If a Text field is a title then the `singleLine` widget is used.
 */
export default function getDefaultWidgetId(field, displayFieldId) {
  const fieldType = toInternalFieldType(field);

  if (fieldType === 'File') {
    return 'fileEditor';
  }

  const hasInValidation = (field.validations || []).find(v => 'in' in v);

  if (hasInValidation && DROPDOWN_TYPES.includes(fieldType)) {
    return 'dropdown';
  }

  const isTextField = fieldType === 'Text';
  const isDisplayField = field.id === displayFieldId;

  if (isTextField && isDisplayField) {
    return 'singleLine';
  }

  return widgetMap.DEFAULTS[fieldType];
}
