import { toInternalFieldType } from './FieldTypes.es6';
import widgetMap from '@contentful/widget-map';

const DROPDOWN_TYPES = ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'];

/*
 * Gets the default widget ID for a field.
 *
 * Uses @contentful/widget-map to determine the value.
 * But it also handles two special scenarios:
 * - If a Text field is a title then the `singleLine` widget is used.
 * - If a field allows predefined values then `dropdown` widget is used
 *   in the presence of the `in` validation.
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

  return widgetMap.DEFAULTS[fieldType];
}
