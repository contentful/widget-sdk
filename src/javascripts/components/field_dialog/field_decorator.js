'use strict';

angular.module('contentful')
.factory('fieldDecorator', ['require', function (require) {
  var schemas     = require('validation').schemas;
  var fieldSchema = schemas.ContentType.atItems(['fields']);

  var fieldProperties = [
    'id', 'name', 'apiName',
    'type', 'linkType',
    'localized', 'required', 'disabled'
  ];

  return {
    decorate: decorate,
    update:   update,
    validate: validate,
    validateInContentType: validateInContentType,
    getDisplayName: getDisplayFieldName,
    isTitleType: isTitleType
  };


  function decorate (field, contentType) {
    var isTitle = (contentType.data.displayField === field.id);
    return _.extend(_.pick(field, fieldProperties), {
      displayName: getDisplayFieldName(field),
      isTitle: isTitle,
      canBeTitle: isTitleType(field.type),
      canBeLocalized: isLocalizable(field.type),
      apiName: field.apiName || field.id
    });
  }

  function extract (decoratedField) {
    return _.pick(decoratedField, fieldProperties);
  }

  function update (decoratedField, field, contentType) {
    _.extend(field, extract(decoratedField));
    var isTitle = decoratedField.isTitle;
    if (isTitle)
      contentType.data.displayField = field.id;
    else if (contentType.data.displayField === field.id && !isTitle)
      contentType.data.displayField = null;
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
    var otherFields = _.reject(contentType.data.fields, {id: field.id});
    var apiNames = _.map(otherFields, 'apiName');
    return (apiNames.indexOf(field.apiName) === -1);
  }

  function isTitleType (fieldType) {
    return fieldType === 'Symbol' || fieldType === 'Text';
  }

  function isLocalizable() {
    // @todo specify localizable content types
    /* var localizableTypes = [];
    return _.includes(localizableTypes, fieldType); */
    return true;
  }

  function getDisplayFieldName (field) {
    if (_.isEmpty(field.name)) {
      if ( _.isEmpty(field.id))
        return 'Untitled field';
      else
        return 'ID: ' + field.id;
    } else {
      return field.name;
    }
  }
}]);
