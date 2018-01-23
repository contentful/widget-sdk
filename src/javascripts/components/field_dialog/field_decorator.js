'use strict';

angular.module('contentful')
.factory('fieldDecorator', ['require', function (require) {
  var schemas = require('validation').schemas;
  var fieldSchema = schemas.ContentType.atItems(['fields']);

  var fieldProperties = [
    'id', 'name', 'apiName',
    'type', 'linkType',
    'localized', 'required', 'disabled'
  ];

  return {
    decorate: decorate,
    update: update,
    validate: validate,
    validateInContentType: validateInContentType,
    getDisplayName: getDisplayFieldName,
    isTitleType: isTitleType
  };


  function decorate (field, contentType) {
    var isTitle = contentType.displayField === field.id;

    return _.extend(_.pick(field, fieldProperties), {
      displayName: getDisplayFieldName(field),
      isTitle: isTitle,
      canBeTitle: isTitleType(field.type),
      canBeLocalized: true,
      apiName: field.apiName || field.id
    });
  }

  function extract (decoratedField) {
    return _.pick(decoratedField, fieldProperties);
  }

  function update (decoratedField, field, contentType) {
    _.extend(field, extract(decoratedField));

    var isTitle = decoratedField.isTitle;
    if (isTitle) {
      contentType.displayField = field.id;
    } else if (contentType.displayField === field.id && !isTitle) {
      contentType.displayField = null;
    }
  }

  /**
   * Returns an array of errors for a decorated field.
   */
  function validate (field) {
    return fieldSchema.errors(extract(field));
  }

  function validateInContentType (field, contentType) {
    var errors = validate(field);
    if (!isApiNameUnique(field, contentType)) {
      errors.push({
        name: 'uniqueFieldId',
        path: ['apiName']
      });
    }
    return errors;
  }

  function isApiNameUnique (field, contentType) {
    var otherFields = _.reject(contentType.fields, {id: field.id});
    var apiNames = _.map(otherFields, 'apiName');
    return apiNames.indexOf(field.apiName) < 0;
  }

  function isTitleType (fieldType) {
    return fieldType === 'Symbol' || fieldType === 'Text';
  }

  function getDisplayFieldName (field) {
    if (_.isEmpty(field.name)) {
      return _.isEmpty(field.id) ? 'Untitled field' : ('ID: ' + field.id);
    } else {
      return field.name;
    }
  }
}]);
