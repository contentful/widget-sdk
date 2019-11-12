import { pick, extend, isEmpty, map, reject } from 'lodash';
import { schemas } from '@contentful/validation';

const fieldSchema = schemas.ContentType.atItems(['fields']);

const fieldProperties = [
  'id',
  'name',
  'apiName',
  'type',
  'linkType',
  'localized',
  'required',
  'disabled'
];

export default {
  decorate,
  update,
  validate,
  validateInContentType,
  getDisplayName: getDisplayFieldName
};

function decorate(field, contentType) {
  const isTitle = contentType.displayField === field.id;

  return extend(pick(field, fieldProperties), {
    displayName: getDisplayFieldName(field),
    isTitle: isTitle,
    canBeTitle: isTitleType(field.type),
    isRichTextField: field.type === 'RichText',
    canBeLocalized: true,
    apiName: field.apiName || field.id
  });
}

function extract(decoratedField) {
  return pick(decoratedField, fieldProperties);
}

function update(decoratedField, field, contentType) {
  extend(field, extract(decoratedField));

  const isTitle = decoratedField.isTitle;
  if (isTitle) {
    contentType.displayField = field.id;
  } else if (contentType.displayField === field.id && !isTitle) {
    contentType.displayField = null;
  }
}

/**
 * Returns an array of errors for a decorated field.
 */
function validate(field) {
  return fieldSchema.errors(extract(field));
}

function validateInContentType(field, contentType) {
  const errors = validate(field);
  if (!isApiNameUnique(field, contentType)) {
    errors.push({
      name: 'uniqueFieldId',
      path: ['apiName']
    });
  }
  return errors;
}

function isApiNameUnique(field, contentType) {
  const otherFields = reject(contentType.fields, { id: field.id });
  const apiNames = map(otherFields, 'apiName');
  return apiNames.indexOf(field.apiName) < 0;
}

function isTitleType(fieldType) {
  return fieldType === 'Symbol' || fieldType === 'Text';
}

function getDisplayFieldName(field) {
  if (isEmpty(field.name)) {
    return isEmpty(field.id) ? 'Untitled field' : 'ID: ' + field.id;
  } else {
    return field.name;
  }
}
